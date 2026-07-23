"use client";

import { useState } from "react";

export function AdminEntitlementForm() {
  const [message, setMessage] = useState(""); const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true); setMessage("");
    const response = await fetch("/api/admin/entitlements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: formData.get("email"), active: formData.get("active") === "true", expiresAt: formData.get("expiresAt") || null }) });
    const payload = await response.json(); setPending(false); setMessage(response.ok ? payload.message : payload.error);
  }
  return <form className="admin-entitlement-form" action={submit}><label>用户邮箱<input type="email" name="email" required placeholder="learner@example.com" /></label><label>操作<select name="active" defaultValue="true"><option value="true">开通 Pro</option><option value="false">撤销手动权益</option></select></label><label>到期时间（可选）<input type="datetime-local" name="expiresAt" /></label><button className="button button-primary" disabled={pending}>{pending ? "处理中…" : "确认修改"}</button>{message && <p aria-live="polite">{message}</p>}</form>;
}
