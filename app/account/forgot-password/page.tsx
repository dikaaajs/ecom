"use client";
import { toast } from "@/lib/notify";
import { useToastFeedback } from "@/lib/hooks/use-toast-feedback";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useToastFeedback("success", "forgot-password-success");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/account/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw Error();
      toast.info("Jika email terdaftar, instruksi reset password akan dikirim.", { id: "forgot-password-result" });
    } catch { toast.error("Permintaan gagal. Coba beberapa saat lagi.", { id: "forgot-password-result" }); }
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
      <Link href="/account/login" className="mt-5 inline-block text-sm font-bold text-blue-700 underline">Kembali ke login</Link>
    </div>
  </main>;
}
