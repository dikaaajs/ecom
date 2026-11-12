"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Layers3, LoaderCircle, LockKeyhole, ShieldCheck, Store } from "lucide-react";
import { useAdminLogin } from "@/lib/hooks/use-admin-login";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const { settings } = useSiteSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAdminLogin();
  function submit(event: FormEvent) { event.preventDefault(); void login(username.trim(), password); }
  return <main className="min-h-svh bg-[#f8fafc] p-4 text-slate-950 sm:p-6 lg:p-8">
    <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-[1440px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:min-h-[calc(100svh-3rem)] lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-[#101b32] p-10 text-white lg:flex lg:flex-col xl:p-14">
        <Link href="/" className="relative z-10 flex w-fit items-center gap-3 text-sm font-semibold">{settings.logoUrl ? <img src={settings.logoUrl} alt="" className="h-9 max-w-28 object-contain" /> : <span className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5"><Store size={20} /></span>}{settings.siteName}</Link>
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-1/3 size-[440px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative my-auto py-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300"><span className="size-1.5 rounded-full bg-blue-400" />Ruang kerja admin</span>
          <h2 className="mt-6 max-w-sm text-4xl font-semibold leading-[1.2] tracking-tight xl:text-5xl">Satu tempat.<br /><span className="text-blue-300">Seluruh toko.</span></h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Kelola produk, pantau pesanan, dan hadirkan pengalaman belanja yang lebih baik.</p>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-400/10 text-blue-300"><Layers3 size={20} /></span><div><p className="text-sm font-semibold">Toko di tangan Anda</p><p className="mt-1 text-xs text-slate-400">Katalog · Pesanan · Pengaturan</p></div></div>
            <div aria-hidden="true" className="mt-5 grid grid-cols-3 gap-2">{[0,1,2].map(i => <div key={i} className="rounded-lg border border-white/5 bg-white/5 p-3"><div className="mb-3 h-1.5 w-7 rounded-full bg-slate-500/40" /><div className="h-2 w-12 max-w-full rounded-full bg-blue-200/50" /></div>)}</div>
          </div>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={15} />Akses khusus pengelola toko</p>
      </aside>
      <section className="flex flex-col px-6 py-7 sm:px-12 sm:py-10 lg:px-14 xl:px-20">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-950"><ArrowLeft size={15} />Kembali ke toko</Link>
        <div className="mx-auto my-auto w-full max-w-sm py-8">
          <div className="mb-7 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50"><LockKeyhole size={22} className="text-slate-700" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Admin portal</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Selamat datang kembali.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Masuk ke dashboard untuk mengelola {settings.siteName}.</p>
          <form onSubmit={submit} className="mt-8 space-y-5" aria-label="Login admin" aria-busy={isLoading}>
            <div className="space-y-2"><Label htmlFor="username" className="text-sm font-medium">Username</Label><Input id="username" autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={isLoading} value={username} onChange={event=>setUsername(event.target.value)} required maxLength={100} placeholder="Masukkan username admin" className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/15" /></div>
            <div className="space-y-2"><Label htmlFor="password" className="text-sm font-medium">Password</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" disabled={isLoading} value={password} onChange={event=>setPassword(event.target.value)} required maxLength={128} placeholder="Masukkan password" className="h-12 rounded-xl border-slate-200 bg-white pl-4 pr-12 text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/15" /><button type="button" disabled={isLoading} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)} className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            <Button type="submit" disabled={isLoading} className="mt-2 h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-none hover:bg-slate-800">{isLoading ? <><LoaderCircle className="size-4 animate-spin" />Memeriksa akun…</> : <>Masuk ke dashboard<ArrowRight className="ml-auto size-4" /></>}</Button>
          </form>
          <div className="mt-7 flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0" />Gunakan akun admin yang diberikan pengelola toko.</div>
        </div>
        <p className="text-center text-xs text-slate-400">Ingin berbelanja? <Link href="/account/login" className="font-medium text-slate-600 underline-offset-4 hover:underline">Masuk sebagai pembeli</Link></p>
      </section>
    </div>
  </main>;
}
