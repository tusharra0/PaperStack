"use client";

import { useEffect, useRef, useState } from "react";

type PriceMap = Record<string, { price: number; changePercent?: number }>;

type IncomingMessage = {
  type: string;
  data?: {
    symbol: string;
    price: number;
    changePercent?: number;
  };
};

const buildWsUrl = () => {
  const base = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const normalized = base.replace(/^http/, "ws");
  return `${normalized}/api/ws/prices`;
};

export function useWebSocket() {
  const [prices, setPrices] = useState<PriceMap>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);
  const subscribedRef = useRef<Set<string>>(new Set());

  const send = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const subscribe = (symbols: string[]) => {
    symbols.forEach((s) => subscribedRef.current.add(s.toUpperCase()));
    send({ action: "subscribe", symbols: symbols.map((s) => s.toUpperCase()) });
  };

  const unsubscribe = (symbols: string[]) => {
    symbols.forEach((s) => subscribedRef.current.delete(s.toUpperCase()));
    send({ action: "unsubscribe", symbols: symbols.map((s) => s.toUpperCase()) });
  };

  useEffect(() => {
    let isMounted = true;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      return;
    }

    const connect = () => {
      const ws = new WebSocket(`${buildWsUrl()}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
        if (subscribedRef.current.size > 0) {
          send({ action: "subscribe", symbols: Array.from(subscribedRef.current) });
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: IncomingMessage = JSON.parse(event.data);
          if (msg.type === "price_update" && msg.data) {
            setPrices((prev) => ({
              ...prev,
              [msg.data!.symbol]: {
                price: msg.data!.price,
                changePercent: msg.data!.changePercent,
              },
            }));
          }
        } catch (e) {
          console.error("ws parse error", e);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        reconnectRef.current += 1;
        const wait = Math.min(10000, 500 * reconnectRef.current);
        setTimeout(connect, wait);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      wsRef.current?.close();
    };
  }, []);

  return { prices, subscribe, unsubscribe };
}

export default useWebSocket;

