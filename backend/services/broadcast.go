package services

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type PriceBroadcaster struct {
	stockSvc *StockService

	mu          sync.RWMutex
	subscribers map[*websocket.Conn]*clientSubscription
}

type clientSubscription struct {
	conn    *websocket.Conn
	userID  string
	symbols map[string]struct{}
}

type priceMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type priceData struct {
	Symbol        string  `json:"symbol"`
	Price         float64 `json:"price"`
	ChangePercent float64 `json:"changePercent"`
}

func NewPriceBroadcaster(stockSvc *StockService) *PriceBroadcaster {
	return &PriceBroadcaster{
		stockSvc:    stockSvc,
		subscribers: make(map[*websocket.Conn]*clientSubscription),
	}
}

func (b *PriceBroadcaster) Register(conn *websocket.Conn, userID string) *clientSubscription {
	b.mu.Lock()
	defer b.mu.Unlock()
	sub := &clientSubscription{
		conn:    conn,
		userID:  userID,
		symbols: make(map[string]struct{}),
	}
	b.subscribers[conn] = sub
	return sub
}

func (b *PriceBroadcaster) Unregister(conn *websocket.Conn) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if _, ok := b.subscribers[conn]; ok {
		conn.Close()
		delete(b.subscribers, conn)
	}
}

func (b *PriceBroadcaster) UpdateSubscription(sub *clientSubscription, add []string, remove []string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if sub == nil {
		return
	}
	for _, sym := range add {
		sym = strings.ToUpper(strings.TrimSpace(sym))
		if sym == "" {
			continue
		}
		sub.symbols[sym] = struct{}{}
	}
	for _, sym := range remove {
		sym = strings.ToUpper(strings.TrimSpace(sym))
		delete(sub.symbols, sym)
	}
}

// Start begins the 5-second broadcast loop.
func (b *PriceBroadcaster) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			b.closeAll()
			return
		case <-ticker.C:
			b.broadcast(ctx)
		}
	}
}

func (b *PriceBroadcaster) broadcast(ctx context.Context) {
	b.mu.RLock()
	subsSnapshot := make([]*clientSubscription, 0, len(b.subscribers))
	symbolSet := make(map[string]struct{})
	for _, sub := range b.subscribers {
		subsSnapshot = append(subsSnapshot, sub)
		for sym := range sub.symbols {
			symbolSet[sym] = struct{}{}
		}
	}
	b.mu.RUnlock()

	if len(symbolSet) == 0 {
		return
	}

	for sym := range symbolSet {
		quote, err := b.stockSvc.GetQuoteWithCache(ctx, sym)
		if err != nil || quote.Price <= 0 {
			continue
		}
		payload := priceMessage{
			Type: "price_update",
			Data: priceData{Symbol: sym, Price: quote.Price, ChangePercent: quote.ChangePercent},
		}
		b.dispatchToSubscribers(payload, subsSnapshot, sym)
	}
}

func (b *PriceBroadcaster) dispatchToSubscribers(msg priceMessage, subs []*clientSubscription, symbol string) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("broadcast marshal error: %v", err)
		return
	}

	for _, sub := range subs {
		if _, ok := sub.symbols[symbol]; !ok {
			continue
		}
		sub.conn.SetWriteDeadline(time.Now().Add(3 * time.Second))
		if err := sub.conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("broadcast write error: %v", err)
			b.Unregister(sub.conn)
		}
	}
}

func (b *PriceBroadcaster) closeAll() {
	b.mu.Lock()
	defer b.mu.Unlock()
	for conn := range b.subscribers {
		conn.Close()
		delete(b.subscribers, conn)
	}
}
