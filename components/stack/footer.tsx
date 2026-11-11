"use client";
import Link from "next/link";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
export function Footer({ compact = false }: { compact?: boolean }) {
  const { settings: s } = useSiteSettings();
  return <footer style={{ backgroundColor: s.footerColor, color: s.footerTextColor }} className={"relative font-satoshi " + (compact ? "mt-0" : "mt-24")}>
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
      <div><Link href="/" className="flex items-center gap-3 text-xl font-bold">{s.logoUrl && <img src={s.logoUrl} alt="" className="h-10 max-w-32 object-contain"/>}{s.siteName}</Link><p className="mt-4 whitespace-pre-line opacity-80">{s.footerDescription}</p></div>
      <div><h3 className="font-bold">Hubungi kami</h3><div className="mt-4 space-y-3">
        {s.contactEmail && <a className="block break-all underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>}
        {s.contactPhone && <p>{s.contactPhone}</p>}{s.storeAddress && <p className="whitespace-pre-line">{s.storeAddress}</p>}
        {!s.contactEmail && !s.contactPhone && !s.storeAddress && <Link href="/account/orders" className="underline">Lihat pesanan Anda</Link>}
      </div></div>
      <div><h3 className="font-bold">Jelajahi toko</h3><Link href="/product" className="mt-4 block underline">Semua produk</Link><Link href="/cart" className="mt-3 block underline">Keranjang</Link>
        <div className="mt-5 flex flex-wrap gap-4">{Object.entries(s.socialLinks).filter(([,url])=>url).map(([name,url])=><a key={name} href={url} target="_blank" rel="noopener noreferrer" className="capitalize underline">{name}</a>)}</div>
      </div>
    </div><p className="border-t border-current/20 px-6 py-5 text-center text-sm opacity-70">© {new Date().getFullYear()} {s.siteName}. All rights reserved.</p>
  </footer>;
}
