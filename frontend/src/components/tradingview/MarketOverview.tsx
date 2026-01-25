"use client";

import { memo, useMemo } from "react";
import TradingViewWidget from "./TradingViewWidget";

interface MarketOverviewProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

function MarketOverview({
  width = "100%",
  height = 450,
  className = "",
}: MarketOverviewProps) {
  const config = useMemo(
    () => ({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      width,
      height,
      largeChartUrl: "",
      isTransparent: false,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(34, 197, 94, 1)",
      plotLineColorFalling: "rgba(239, 68, 68, 1)",
      gridLineColor: "rgba(240, 243, 250, 0)",
      scaleFontColor: "rgba(148, 163, 184, 1)",
      belowLineFillColorGrowing: "rgba(34, 197, 94, 0.12)",
      belowLineFillColorFalling: "rgba(239, 68, 68, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(34, 197, 94, 0)",
      belowLineFillColorFallingBottom: "rgba(239, 68, 68, 0)",
      symbolActiveColor: "rgba(34, 197, 94, 0.12)",
      tabs: [
        {
          title: "Indices",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500 Index" },
            { s: "FOREXCOM:NSXUSD", d: "US 100 Cash CFD" },
            { s: "FOREXCOM:DJI", d: "Dow Jones Industrial Average Index" },
            { s: "INDEX:NKY", d: "Nikkei 225" },
            { s: "INDEX:DEU40", d: "DAX Index" },
          ],
        },
        {
          title: "Stocks",
          symbols: [
            { s: "NASDAQ:AAPL", d: "Apple Inc" },
            { s: "NASDAQ:GOOGL", d: "Alphabet Inc" },
            { s: "NASDAQ:MSFT", d: "Microsoft Corp" },
            { s: "NASDAQ:AMZN", d: "Amazon.com Inc" },
            { s: "NASDAQ:NVDA", d: "NVIDIA Corp" },
            { s: "NASDAQ:TSLA", d: "Tesla Inc" },
          ],
        },
        {
          title: "Crypto",
          symbols: [
            { s: "BITSTAMP:BTCUSD", d: "Bitcoin / USD" },
            { s: "BITSTAMP:ETHUSD", d: "Ethereum / USD" },
            { s: "BINANCE:SOLUSDT", d: "Solana / USDT" },
          ],
        },
      ],
    }),
    [width, height]
  );

  return (
    <TradingViewWidget
      widgetType="market-overview"
      config={config}
      className={className}
    />
  );
}

export default memo(MarketOverview);
