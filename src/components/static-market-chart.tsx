import { generateChartData } from "@/lib/chart-data";

export function StaticMarketChart({ seed = 29, height = 360, ariaLabel = "历史K线图" }: { seed?: number; height?: number; ariaLabel?: string }) {
  const { candles, volume } = generateChartData(seed, 64);
  const width = 800; const paddingX = 18; const paddingY = 18; const volumeHeight = Math.max(36, height * 0.18); const priceBottom = height - volumeHeight - 12;
  const low = Math.min(...candles.map((item) => item.low)); const high = Math.max(...candles.map((item) => item.high)); const range = Math.max(1, high - low); const maxVolume = Math.max(...volume.map((item) => Number(item.value)));
  const step = (width - paddingX * 2) / candles.length; const bodyWidth = Math.max(3, step * 0.56);
  const priceY = (value: number) => paddingY + ((high - value) / range) * (priceBottom - paddingY);

  return <div className="market-chart static-market-chart" role="img" aria-label={ariaLabel} style={{ height }}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {[0.2, 0.4, 0.6, 0.8].map((ratio) => <line className="static-chart-grid" key={ratio} x1={paddingX} x2={width - paddingX} y1={paddingY + (priceBottom - paddingY) * ratio} y2={paddingY + (priceBottom - paddingY) * ratio} />)}
      {volume.map((item, index) => { const barHeight = (Number(item.value) / maxVolume) * volumeHeight; return <rect className="static-chart-volume" key={`v-${String(item.time)}`} x={paddingX + index * step} y={height - barHeight} width={Math.max(2, bodyWidth)} height={barHeight} data-direction={candles[index].close >= candles[index].open ? "up" : "down"} />; })}
      {candles.map((item, index) => { const up = item.close >= item.open; const x = paddingX + index * step + step / 2; const open = priceY(item.open); const close = priceY(item.close); return <g className={up ? "static-candle up" : "static-candle down"} key={String(item.time)}><line x1={x} x2={x} y1={priceY(item.high)} y2={priceY(item.low)} /><rect x={x - bodyWidth / 2} y={Math.min(open, close)} width={bodyWidth} height={Math.max(1.5, Math.abs(close - open))} /></g>; })}
    </svg>
  </div>;
}
