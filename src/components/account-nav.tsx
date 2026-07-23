import Link from "next/link";

const items = [["/dashboard", "概览"], ["/review", "练习复盘"], ["/notes", "笔记"], ["/bookmarks", "收藏"], ["/billing", "订阅"], ["/settings", "设置"]] as const;
export function AccountNav({ active }: { active: string }) { return <nav className="account-nav" aria-label="账户导航">{items.map(([href, label]) => <Link className={active === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav>; }
