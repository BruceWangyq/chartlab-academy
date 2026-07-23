"use client";

import dynamic from "next/dynamic";

const MarketChart = dynamic(
  () => import("@/components/market-chart").then((module) => module.MarketChart),
  { ssr: false, loading: () => <div className="market-chart chart-loading" role="status" aria-label="正在加载历史图表" /> },
);

export function DeferredMarketChart(props: React.ComponentProps<typeof MarketChart>) {
  return <MarketChart {...props} />;
}
