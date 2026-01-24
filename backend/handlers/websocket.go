package handlers

import (
	"net/http"

	"paperstack/services"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type subscriptionMessage struct {
	Action  string   `json:"action"`
	Symbols []string `json:"symbols"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// PricesWebSocketHandler upgrades to websocket and registers the connection.
func PricesWebSocketHandler(broadcaster *services.PriceBroadcaster, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.Query("token")
		if token == "" {
			utils.UnauthorizedError(c)
			return
		}
		userID, err := utils.ValidateToken(token, jwtSecret)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		sub := broadcaster.Register(conn, userID)
		defer broadcaster.Unregister(conn)

		for {
			var msg subscriptionMessage
			if err := conn.ReadJSON(&msg); err != nil {
				break
			}
			switch msg.Action {
			case "subscribe":
				broadcaster.UpdateSubscription(sub, msg.Symbols, nil)
			case "unsubscribe":
				broadcaster.UpdateSubscription(sub, nil, msg.Symbols)
			}
		}
	}
}
