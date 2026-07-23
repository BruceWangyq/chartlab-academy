"use client";
export function LogoutButton() { async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; } return <button onClick={logout}>退出登录</button>; }
