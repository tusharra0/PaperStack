"use client";

import { memo, useMemo } from "react";
import TradingViewWidget from "./TradingViewWidget";

interface MiniChartProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

function MiniChart({
  symbol = "NASDAQ:AAPL",
  width = "100%",
  height = 220,
  className = "",
}: MiniChartProps) {
  const config = useMemo(
    () => ({
      symbol,
      width,
      height,
      locale: "en",
      dateRange: "1M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: false,
      largeChartUrl: "",
      noTimeScale: false,
      chartOnly: false,
    }),
    [symbol, width, height]
  );

  return (
    <TradingViewWidget
      widgetType="mini-chart"
      config={config}
      className={className}
      containerId={`mini-chart-${symbol.replace(":", "-")}`}
    />
  );
}

export default memo(MiniChart);
