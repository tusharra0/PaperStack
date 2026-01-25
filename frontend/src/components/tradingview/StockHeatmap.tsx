"use client";

import { memo, useMemo } from "react";
import TradingViewWidget from "./TradingViewWidget";

interface StockHeatmapProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

function StockHeatmap({
  width = "100%",
  height = 500,
  className = "",
}: StockHeatmapProps) {
  const config = useMemo(
    () => ({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "en",
      symbolUrl: "",
      colorTheme: "dark",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width,
      height,
      isTransparent: false,
    }),
    [width, height]
  );

  return (
    <TradingViewWidget
      widgetType="stock-heatmap"
      config={config}
      className={className}
    />
  );
}

export default memo(StockHeatmap);
