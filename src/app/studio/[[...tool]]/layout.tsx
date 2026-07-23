import type { Metadata } from "next";
export const metadata: Metadata = { title: "内容后台", robots: { index: false, follow: false } };
export default function StudioLayout({ children }: { children: React.ReactNode }) { return children; }
