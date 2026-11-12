"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, ShoppingBag, UserRound } from "lucide-react";
import { storefrontAccountLink } from "@/lib/account/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const pathname=usePathname();
  const {settings:s}=useSiteSettings();
  const {data:session}=useSession();
  const {count,ready}=useCart();
  const [scrolled,setScrolled]=useState(false);
  const [open,setOpen]=useState(false);
  useEffect(()=>{const update=()=>setScrolled(window.scrollY>24);update();window.addEventListener("scroll",update,{passive:true});return()=>window.removeEventListener("scroll",update);},[]);
  if(pathname.startsWith("/dashboard") || pathname.startsWith("/auth/"))return null;
  const solid=pathname!=="/" || scrolled;
  const {href:accountHref,label:accountLabel}=storefrontAccountLink(session?.user?.role);
  const links=[{label:"Koleksi",href:"/#explore"},{label:"Cara belanja",href:"/#how-it-works"},...(s.showReviews?[{label:"Ulasan",href:"/#reviews"}]:[])];
  return <header className={"fixed inset-x-0 top-0 z-40 border-b transition-colors duration-200 "+(solid?"border-slate-200/80 bg-white/95 text-slate-900 shadow-sm backdrop-blur-xl":"border-white/15 bg-slate-950/10 text-white")}>
    <div className="landing-container flex h-20 items-center justify-between gap-4">
      <Link href="/" aria-label={s.siteName} className="flex min-w-0 max-w-[230px] items-center gap-3">{s.logoUrl && <img src={s.logoUrl} alt="" className="h-9 max-w-28 object-contain"/>}<span className="truncate text-base font-extrabold tracking-tight sm:text-lg">{s.siteName}</span></Link>
      <nav aria-label="Navigasi utama" className="hidden items-center gap-8 text-sm font-medium lg:flex">{links.map(link=><a key={link.href} href={link.href} className="opacity-80 transition hover:opacity-100">{link.label}</a>)}</nav>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4"><Link href="/cart" aria-label={`Keranjang${ready && count>0?`, ${count} produk`:""}`} className="relative rounded-full p-2.5"><ShoppingBag size={20}/>{ready&&count>0&&<span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">{count}</span>}</Link><Link href={accountHref} aria-label={accountLabel} className="rounded-full p-2.5 sm:hidden"><UserRound size={20}/></Link><Link href={accountHref} className="storefront-btn-primary hidden items-center gap-2 rounded-full px-5 py-3 text-xs font-bold sm:inline-flex">{accountLabel}<UserRound size={15}/></Link>
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><button aria-label="Buka menu" className="rounded-full p-2.5 lg:hidden"><Menu size={22}/></button></SheetTrigger><SheetContent side="right" className="px-6"><SheetTitle className="mt-8 text-lg font-bold">{s.siteName}</SheetTitle><nav aria-label="Menu ponsel" className="mt-8 flex flex-col gap-6">{links.map(link=><a key={link.href} href={link.href} onClick={()=>setOpen(false)} className="font-semibold">{link.label}</a>)}<Link href={accountHref} onClick={()=>setOpen(false)} className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-bold text-white">{accountLabel}</Link><Link href="/cart" onClick={()=>setOpen(false)} className="text-sm">Lihat keranjang {ready&&count>0?`(${count})`:""}</Link></nav></SheetContent></Sheet>
      </div>
    </div>
  </header>;
}
