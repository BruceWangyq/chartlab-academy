"use client";

import { useEffect, useRef, useState } from "react";
import { Check, PencilLine } from "lucide-react";

export function LessonNote({ lessonId, accountSync = false }: { lessonId: string; accountSync?: boolean }) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "synced" | "limit" | "offline">("idle");
  const hydrated = useRef(false);
  useEffect(() => {
    const saved = window.localStorage.getItem(`chartlab:note:${lessonId}`) ?? "";
    const frame = window.requestAnimationFrame(() => {
      if (saved) setNote(saved);
      hydrated.current = true;
    });
    if (accountSync) fetch(`/api/learning/lesson/${lessonId}`).then(async (response) => response.ok ? response.json() : null).then((data) => {
      if (typeof data?.note !== "string") return;
      setNote(data.note); window.localStorage.setItem(`chartlab:note:${lessonId}`, data.note);
    }).catch(() => undefined);
    return () => window.cancelAnimationFrame(frame);
  }, [accountSync, lessonId]);
  useEffect(() => {
    if (!hydrated.current) return;
    setStatus("saving");
    const timer = window.setTimeout(async () => {
      window.localStorage.setItem(`chartlab:note:${lessonId}`, note);
      let synced = false;
      if (accountSync) try { const response = await fetch(`/api/learning/lesson/${lessonId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ note }) }); synced = response.ok; if (!response.ok) { const payload = await response.json(); setStatus(payload.upgradeRequired ? "limit" : "offline"); return; } } catch { setStatus("offline"); return; }
      setStatus(synced ? "synced" : "saved");
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [accountSync, lessonId, note]);
  return <div className="lesson-note"><label htmlFor="lesson-note"><PencilLine size={17} />本课笔记</label><textarea id="lesson-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="写下你的观察、疑问或失效条件…" /><footer><span>{note.length} / 1000</span><span aria-live="polite">{status === "saving" ? "保存中…" : status === "synced" ? <><Check size={13} />已同步账户</> : status === "saved" ? <><Check size={13} />已保存在本机</> : status === "limit" ? <>已保存在本机；免费笔记已达20条 · <a href="/pricing?limit=personal">查看 Pro</a></> : status === "offline" ? "已保存在本机；账户同步失败" : "2秒后自动保存"}</span></footer></div>;
}
