import Link from "next/link";
import { BookOpen, FlaskConical, Library, Menu, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";

const nav = [
  { href: "/courses", label: "课程", icon: BookOpen },
  { href: "/cases", label: "历史案例", icon: FlaskConical },
  { href: "/library", label: "知识库", icon: Library },
  { href: "/pricing", label: "定价" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="主导航">
          {nav.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="text-action" href="/dashboard"><UserRound size={18} />学习中心</Link>
          <Link className="button button-primary button-sm" href="/login">登录 / 注册</Link>
          <details className="mobile-menu">
            <summary aria-label="打开导航"><Menu size={22} /></summary>
            <nav aria-label="移动导航">
              {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href}>{Icon ? <Icon size={18} /> : null}{label}</Link>)}
              <Link href="/dashboard"><UserRound size={18} />学习中心</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
