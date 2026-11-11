"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";

export default function BuyerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(""); setLoading(true);
    try {
      const result = await signIn("customer", { email, password, redirect: false });
      if (!result?.ok || result.error) {
        setError("Email/password tidak sesuai, akun belum diverifikasi, atau percobaan login sedang dibatasi.");
        return;
      }
      router.push("/account/orders");
      router.refresh();
    } catch {
      setError("Login gagal. Coba lagi.");
    } finally { setLoading(false); }
  };
  return (
    <main className="min-h-screen bg-[#f6f9ff] px-4 pb-12 pt-32 font-satoshi">
      <div className="mx-auto max-w-md rounded-2xl border border-blue-100 bg-white p-7 shadow-sm">
        <LockKeyhole size={26} className="text-blue-600"/>
        <h1 className="mt-3 text-2xl font-extrabold">Masuk Akun Pembeli</h1>
        <p className="mt-2 text-sm text-slate-500">Akses pesanan dan produk digital dari perangkat mana pun.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">Email
            <input required type="email" autoComplete="email" maxLength={200} value={email} onChange={e=>setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border p-3 outline-none focus:border-blue-500"/>
          </label>
          <label className="block text-sm font-semibold">Password
            <input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border p-3 outline-none focus:border-blue-500"/>
          </label>
          {!!error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">
            <LogIn size={18}/>{loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><Link href="/account/forgot-password" className="underline">Lupa password?</Link><Link href="/account/verify" className="underline">Belum verifikasi email?</Link></div>
        <p className="mt-5 text-sm text-slate-600">Belum punya akun? <Link href="/account/register" className="font-bold text-blue-700 underline">Daftar sekarang</Link></p>
        <p className="mt-3 text-xs text-slate-500">Akun pembeli berbeda dari akun admin toko.</p>
      </div>
    </main>
  );
}
