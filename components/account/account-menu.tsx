"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { UserRound, Package, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/notify";
export function AccountMenu() {
  const path=usePathname();
  const [leaving,setLeaving]=useState(false);
  const logout=async()=>{
    if(leaving)return;setLeaving(true);
    try { await signOut({redirect:false});window.location.replace("/account/login"); }
    catch { setLeaving(false);toast.error("Belum dapat keluar. Periksa koneksi lalu coba lagi."); }
  };
  return <nav aria-label="Menu akun pembeli" className="mb-7 flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-2 text-sm">
    {[{href:"/account/profile",label:"Profil saya",icon:UserRound},{href:"/account/orders",label:"Pesanan saya",icon:Package}].map(item=><Link key={item.href} href={item.href} className={"inline-flex items-center gap-2 rounded-xl px-4 py-3 font-semibold "+(path.startsWith(item.href)?"bg-blue-50 text-blue-700":"text-slate-500")}><item.icon size={17}/>{item.label}</Link>)}
    <button type="button" disabled={leaving} onClick={()=>void logout()} className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-3 text-slate-500 disabled:opacity-50"><LogOut size={17}/>{leaving?"Keluar…":"Keluar"}</button>
  </nav>;
}
