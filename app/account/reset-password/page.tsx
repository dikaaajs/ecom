"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") || "";
    if (value) {
      setToken(value);
      window.history.replaceState(null, "", "/account/reset-password");
    }
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice("");
    if (password !== confirm) { setError("Konfirmasi password tidak cocok."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/account/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body: { error?: string; message?: string } = await response.json();
      if (!response.ok) throw new Error(body.error || "Reset gagal.");
      setNotice(body.message || "Password diperbarui. Silakan masuk.");
      setToken("");
      setPassword(""); setConfirm("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Reset gagal."); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-[#f6f9ff] px-4 pb-12 pt-32 font-satoshi">
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-extrabold">Reset Password</h1>
      {token ? <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-sm font-semibold">Password baru (minimal 12 karakter)
          <input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2"/>
        </label>
        <label className="block text-sm font-semibold">Ulangi password baru
          <input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2"/>
        </label>
        <button disabled={busy} type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Memproses..." : "Simpan password baru"}</button>
      </form> : <p className="mt-4 text-sm text-slate-600">Gunakan tautan dari email reset password. Jika link sudah dipakai atau tidak tersedia, minta link baru.</p>}
      {!!error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!!notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="mt-5 flex gap-4 text-sm font-semibold text-blue-700">
        <Link href="/account/forgot-password" className="underline">Minta link baru</Link>
        <Link href="/account/login" className="underline">Masuk</Link>
      </div>
    </div>
  </main>;
}
