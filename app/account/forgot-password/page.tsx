"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/account/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw Error();
      setNotice("Jika email terdaftar, instruksi reset password akan dikirim.");
    } catch { setNotice("Permintaan gagal. Coba beberapa saat lagi."); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-[#f6f9ff] px-4 pb-12 pt-32 font-satoshi">
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-extrabold">Lupa Password</h1>
      <p className="mt-2 text-sm text-slate-600">Masukkan email akun pembeli untuk menerima tautan reset.</p>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-semibold">Email
          <input required type="email" maxLength={200} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2"/>
        </label>
        <button disabled={busy} type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Mengirim..." : "Kirim tautan reset"}</button>
      </form>
      {!!notice && <p role="status" className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{notice}</p>}
      <Link href="/account/login" className="mt-5 inline-block text-sm font-bold text-blue-700 underline">Kembali ke login</Link>
    </div>
  </main>;
}
