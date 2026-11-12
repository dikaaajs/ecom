"use client";
import { toast } from "@/lib/notify";
import { useToastFeedback } from "@/lib/hooks/use-toast-feedback";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

export default function VerifyEmailPage() {
  const started = useRef(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useToastFeedback("success", "verify-success");
  const [error, setError] = useToastFeedback("error", "verify-error");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
    const token = params.get("token");
    if (!token) return;
    window.history.replaceState(null, "", "/account/verify");
    // Keep this one-time request alive across React StrictMode effect replay.
    setBusy(true); setError("");
    void fetch("/api/account/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async response => {
      const result: { message?: string; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Verifikasi tidak berhasil.");
      setNotice(result.message || "Email telah diverifikasi.");
    }).catch(err => {
      setError(err instanceof Error ? err.message : "Verifikasi gagal.");
    }).finally(() => { setBusy(false); });
  }, []);

  const resend = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/resend-verification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw Error("Permintaan gagal.");
      toast.info("Jika email terdaftar dan belum terverifikasi, tautan baru akan dikirim.", { id: "verify-resend" });
    } catch { setError("Gagal mengirim permintaan. Coba lagi."); }
    finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[#f6f9ff] px-4 pb-12 pt-32 font-satoshi">
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-extrabold">Verifikasi Email</h1>
      <p className="mt-3 text-sm text-slate-500">Periksa inbox dan folder spam untuk tautan verifikasi.</p>
      {busy && <p role="status" className="mt-4 text-sm text-slate-600">Memproses permintaan...</p>}
      <form onSubmit={resend} className="mt-5 space-y-3">
        <label className="block text-sm font-semibold">Kirim ulang link verifikasi
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2" placeholder="email@contoh.com"/>
        </label>
        <button disabled={busy} type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">Kirim ulang verifikasi</button>
      </form>
      <Link href="/account/login" className="mt-5 inline-block text-sm font-bold text-blue-700 underline">Kembali ke login</Link>
    </div>
  </main>;
}
