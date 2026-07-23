"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, CheckCircle2 } from "lucide-react";

export function LessonActions({ lessonId, accountSync = false }: { lessonId: string; accountSync?: boolean }) {
  const [complete, setComplete] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [message, setMessage] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  useEffect(() => {
    const localComplete = window.localStorage.getItem(`chartlab:complete:${lessonId}`) === "true";
    const localBookmark = window.localStorage.getItem(`chartlab:bookmark:${lessonId}`) === "true";
    const frame = requestAnimationFrame(() => { setComplete(localComplete); setBookmarked(localBookmark); });
    if (accountSync) fetch(`/api/learning/lesson/${lessonId}`).then(async (response) => response.ok ? response.json() : null).then((data) => {
      if (!data) return;
      setComplete(data.completed); setBookmarked(data.bookmarked);
      window.localStorage.setItem(`chartlab:complete:${lessonId}`, String(data.completed));
      window.localStorage.setItem(`chartlab:bookmark:${lessonId}`, String(data.bookmarked));
    }).catch(() => undefined);
    return () => cancelAnimationFrame(frame);
  }, [accountSync, lessonId]);
  function toggleComplete() {
    setMessage(""); setUpgradeRequired(false);
    const next = !complete; setComplete(next);
    window.localStorage.setItem(`chartlab:complete:${lessonId}`, String(next));
    if (next) window.localStorage.setItem(`chartlab:completeAt:${lessonId}`, new Date().toISOString()); else window.localStorage.removeItem(`chartlab:completeAt:${lessonId}`);
    if (accountSync) void sync({ completed: next }, () => { setComplete(!next); window.localStorage.setItem(`chartlab:complete:${lessonId}`, String(!next)); });
  }
  function toggleBookmark() {
    setMessage(""); setUpgradeRequired(false);
    const next = !bookmarked; setBookmarked(next);
    window.localStorage.setItem(`chartlab:bookmark:${lessonId}`, String(next));
    if (accountSync) void sync({ bookmarked: next }, () => { setBookmarked(!next); window.localStorage.setItem(`chartlab:bookmark:${lessonId}`, String(!next)); });
  }
  async function sync(update: { completed?: boolean; bookmarked?: boolean }, rollback: () => void) {
    try {
      const response = await fetch(`/api/learning/lesson/${lessonId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(update) });
      if (!response.ok) { const payload = await response.json(); rollback(); setUpgradeRequired(Boolean(payload.upgradeRequired)); setMessage(payload.error ?? "账户同步失败，请稍后重试。"); }
    } catch { rollback(); setMessage("网络不可用，更改没有同步到账户。"); }
  }
  return <div className="lesson-actions"><button className={complete ? "is-active" : ""} onClick={toggleComplete}><CheckCircle2 />{complete ? "已完成" : "标记完成"}</button><button className={bookmarked ? "is-active" : ""} onClick={toggleBookmark}><Bookmark />{bookmarked ? "已收藏" : "收藏"}</button>{message && <span className="lesson-action-error" role="alert">{message}{upgradeRequired && <> <Link href="/pricing?limit=personal">查看 Pro</Link></>}</span>}</div>;
}
