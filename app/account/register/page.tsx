"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { UserRoundPlus } from "lucide-react";

export default function BuyerRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Konfirmasi password tidak cocok."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) throw new Error(json.error || "Pendaftaran gagal.");
      window.location.assign("/account/verify?email=" + encodeURIComponent(email.trim().toLowerCase()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pendaftaran gagal.");
    } finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-[#f6f9ff] px-4 pb-12 pt-32 font-satoshi">
    <div className="mx-auto max-w-md rounded-2xl border border-blue-100 bg-white p-7 shadow-sm">
      <UserRoundPlus className="text-blue-600" size={27}/>
      <h1 className="mt-3 text-2xl font-extrabold">Daftar Akun Pembeli</h1>
      <p className="mt-2 text-sm text-slate-500">Simpan riwayat belanja dan akses produk digital. Verifikasi email diperlukan sebelum login.</p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-semibold">Nama lengkap
          <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}
            className="mt-1 block w-full rounded-xl border p-3 focus:border-blue-500 focus:outline-none"/>
        </label>
        <label className="block text-sm font-semibold">Email
          <input required type="email" maxLength={200} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}
            className="mt-1 block w-full rounded-xl border p-3 focus:border-blue-500 focus:outline-none"/>
        </label>
        <label className="block text-sm font-semibold">Password (minimal 12 karakter)
          <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}
            className="mt-1 block w-full rounded-xl border p-3 focus:border-blue-500 focus:outline-none"/>
        </label>
        <label className="block text-sm font-semibold">Ulangi password
          <input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}
            className="mt-1 block w-full rounded-xl border p-3 focus:border-blue-500 focus:outline-none"/>
        </label>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">
          {busy ? "Membuat akun..." : "Buat Akun"}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-600">Sudah punya akun? <Link href="/account/login" className="font-bold text-blue-700 underline">Masuk</Link></p>
    </div>
  </main>;
}
