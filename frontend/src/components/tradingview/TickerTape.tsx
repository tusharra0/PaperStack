"use client";

import { memo } from "react";
import TradingViewWidget from "./TradingViewWidget";

interface TickerTapeProps {
  className?: string;
}

const symbols = [
  { proName: "NASDAQ:AAPL", title: "Apple" },
  { proName: "NASDAQ:MSFT", title: "Microsoft" },
  { proName: "NASDAQ:GOOGL", title: "Google" },
  { proName: "NASDAQ:AMZN", title: "Amazon" },
  { proName: "NASDAQ:NVDA", title: "NVIDIA" },
  { proName: "NASDAQ:TSLA", title: "Tesla" },
  { proName: "NASDAQ:META", title: "Meta" },
  { proName: "NYSE:JPM", title: "JPMorgan" },
];

const config = {
  symbols,
  showSymbolLogo: true,
  isTransparent: false,
  displayMode: "adaptive",
  colorTheme: "dark",
  locale: "en",
};

function TickerTape({ className = "" }: TickerTapeProps) {
  return (
    <TradingViewWidget
      widgetType="ticker-tape"
      config={config}
      className={className}
    />
  );
}

export default memo(TickerTape);
