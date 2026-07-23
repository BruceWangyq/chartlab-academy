import type { CandlestickData, HistogramData, Time } from "lightweight-charts";

export type GeneratedChartData = { candles: CandlestickData<Time>[]; volume: HistogramData<Time>[] };

function random(seed: number) {
  let state = seed >>> 0;
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
}

export function generateChartData(seed: number, count = 120): GeneratedChartData {
  const next = random(seed);
  const candles: CandlestickData<Time>[] = [];
  const volume: HistogramData<Time>[] = [];
  let close = 104 + (seed % 17);
  const start = Date.UTC(2018 + (seed % 5), 0, 2);
  for (let index = 0; index < count; index += 1) {
    const phase = index / count;
    const trend = phase < 0.28 ? -0.25 : phase < 0.56 ? 0.08 : phase < 0.78 ? -0.18 : 0.42;
    const open = close + (next() - 0.5) * 1.8;
    close = Math.max(42, open + trend + (next() - 0.48) * 4.2);
    const high = Math.max(open, close) + next() * 2.4;
    const low = Math.min(open, close) - next() * 2.4;
    const time = Math.floor((start + index * 86400000) / 1000) as Time;
    candles.push({ time, open, high, low, close });
    volume.push({ time, value: Math.round(220000 + next() * 720000 + Math.abs(close - open) * 100000), color: close >= open ? "#28b8a066" : "#f0645b66" });
  }
  return { candles, volume };
}
