"use client";

import { useEffect, useMemo, useRef } from "react";
import { CandlestickSeries, createChart, HistogramSeries } from "lightweight-charts";
import { generateChartData } from "@/lib/chart-data";

type MarketChartProps = { seed?: number; height?: number; ariaLabel?: string; showDataSummary?: boolean };

export function MarketChart({ seed = 29, height = 360, ariaLabel = "历史K线图", showDataSummary = false }: MarketChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const recentRows = useMemo(() => {
    const data = generateChartData(seed);
    const firstIndex = Math.max(0, data.candles.length - 10);
    return data.candles.slice(firstIndex).map((candle, index) => ({
      ...candle,
      volume: data.volume[firstIndex + index]?.value ?? 0,
    }));
  }, [seed]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const data = generateChartData(seed);
    const chart = createChart(container, {
      width: container.clientWidth, height,
      layout: { background: { color: "#0d192a" }, textColor: "#9fb0c8", attributionLogo: false },
      grid: { vertLines: { color: "#1a2a3f" }, horzLines: { color: "#1a2a3f" } },
      crosshair: { vertLine: { color: "#597395" }, horzLine: { color: "#597395" } },
      rightPriceScale: { borderColor: "#30435d", scaleMargins: { top: 0.08, bottom: 0.24 } },
      timeScale: { borderColor: "#30435d", timeVisible: true },
    });
    const candles = chart.addSeries(CandlestickSeries, { upColor: "#28b8a0", downColor: "#f0645b", borderVisible: false, wickUpColor: "#53d1bd", wickDownColor: "#f98b82" });
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    candles.setData(data.candles); volume.setData(data.volume); chart.timeScale().fitContent();
    const observer = new ResizeObserver(([entry]) => chart.applyOptions({ width: entry.contentRect.width }));
    observer.observe(container);
    return () => { observer.disconnect(); chart.remove(); };
  }, [height, seed]);
  return <div className="market-chart-wrap">
    <div className="market-chart" ref={containerRef} role="img" aria-label={ariaLabel} />
    {showDataSummary && <details className="chart-data-summary">
      <summary>查看最近 10 根K线的表格数据</summary>
      <div tabIndex={0} role="region" aria-label={`${ariaLabel}表格数据`}>
        <table>
          <caption className="sr-only">{ariaLabel}最近 10 个交易日的开盘、最高、最低、收盘和成交量</caption>
          <thead><tr><th scope="col">日期</th><th scope="col">开盘</th><th scope="col">最高</th><th scope="col">最低</th><th scope="col">收盘</th><th scope="col">成交量</th></tr></thead>
          <tbody>{recentRows.map((row) => <tr key={String(row.time)}><th scope="row">{String(row.time)}</th><td>{row.open.toFixed(2)}</td><td>{row.high.toFixed(2)}</td><td>{row.low.toFixed(2)}</td><td>{row.close.toFixed(2)}</td><td>{Math.round(row.volume).toLocaleString("zh-CN")}</td></tr>)}</tbody>
        </table>
      </div>
    </details>}
  </div>;
}
