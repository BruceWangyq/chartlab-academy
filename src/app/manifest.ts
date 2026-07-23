import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "图表研习社 · ChartLab Academy", short_name: "图表研习社", description: "中文技术分析教育与历史图表练习", start_url: "/", display: "standalone", background_color: "#f7f8fb", theme_color: "#0b1220", lang: "zh-CN" }; }
