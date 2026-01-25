"use client";

import { memo, useMemo } from "react";
import TradingViewWidget from "./TradingViewWidget";

interface SymbolOverviewProps {
  symbols?: string[][];
  width?: string | number;
  height?: string | number;
  className?: string;
}

function SymbolOverview({
  symbols = [["Apple", "AAPL|1D"]],
  width = "100%",
  height = 400,
  className = "",
}: SymbolOverviewProps) {
  const config = useMemo(
    () => ({
      symbols,
      chartOnly: false,
      width,
      height,
      locale: "en",
      colorTheme: "dark",
      autosize: false,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
      maLineColor: "#2962FF",
      maLineWidth: 1,
      maLength: 9,
      headerFontSize: "medium",
      lineWidth: 2,
      lineType: 0,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
      isTransparent: false,
      backgroundColor: "rgba(0, 0, 0, 1)",
    }),
    [symbols, width, height]
  );

  return (
    <TradingViewWidget
      widgetType="symbol-overview"
      config={config}
      className={className}
    />
  );
}

export default memo(SymbolOverview);
