"use client";

import { useEffect, useRef, memo } from "react";

export type WidgetType =
  | "ticker-tape"
  | "mini-chart"
  | "symbol-overview"
  | "market-overview"
  | "stock-heatmap"
  | "advanced-chart";

interface TradingViewWidgetProps {
  widgetType: WidgetType;
  config: Record<string, unknown>;
  className?: string;
  containerId?: string;
}

const WIDGET_SCRIPTS: Record<WidgetType, string> = {
  "ticker-tape": "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js",
  "mini-chart": "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js",
  "symbol-overview": "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js",
  "market-overview": "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js",
  "stock-heatmap": "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js",
  "advanced-chart": "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
};

function TradingViewWidget({
  widgetType,
  config,
  className = "",
  containerId,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetContainer.appendChild(widgetDiv);

    // Create and configure script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = WIDGET_SCRIPTS[widgetType];
    script.async = true;
    script.innerHTML = JSON.stringify(config);

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);
    scriptRef.current = script;

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [widgetType, config]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={className}
    />
  );
}

export default memo(TradingViewWidget);
