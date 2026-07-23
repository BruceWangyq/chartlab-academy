import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="图表研习社首页">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><b /></span>
      {!compact && <span className="brand-copy"><strong>图表研习社</strong><small>观察 · 练习 · 复盘</small></span>}
    </Link>
  );
}
