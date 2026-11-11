"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Palette, ExternalLink, RotateCcw, Plus, Trash2 } from "lucide-react";
import { defaultSiteSettings, siteSettingsSchema, type SiteSettings } from "@/lib/site-settings";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { ReviewSettings } from "@/components/settings/review-settings";

type Field = { key: keyof SiteSettings; label: string; type?: "image" | "textarea" | "color" };
const groups: { title: string; description: string; fields: Field[] }[] = [
  { title: "Identitas toko", description: "Nama dan deskripsi juga dipakai untuk judul tab dan mesin pencari.", fields: [
    {key:"siteName",label:"Nama toko"},{key:"siteDescription",label:"Deskripsi website",type:"textarea"},
    {key:"logoUrl",label:"Logo",type:"image"},{key:"faviconUrl",label:"Ikon tab / favicon",type:"image"}] },
  { title: "Warna & background", description: "Warna ini diterapkan pada halaman toko. Dashboard tetap memakai tampilannya sendiri.", fields: [
    {key:"primaryColor",label:"Warna utama / tombol",type:"color"},{key:"buttonTextColor",label:"Teks tombol",type:"color"},
    {key:"backgroundColor",label:"Background halaman",type:"color"},{key:"textColor",label:"Teks halaman",type:"color"},
    {key:"footerColor",label:"Background footer",type:"color"},{key:"footerTextColor",label:"Teks footer",type:"color"}] },
  { title: "Banner halaman utama", description: "Atur gambar, judul, pengumuman, dan tombol utama.", fields: [
    {key:"heroImage",label:"Gambar background banner",type:"image"},{key:"heroTitle",label:"Judul banner"},
    {key:"heroDescription",label:"Deskripsi banner",type:"textarea"},{key:"heroButtonText",label:"Teks tombol"},
    {key:"heroButtonLink",label:"Tujuan tombol"},{key:"announcement",label:"Pengumuman (kosongkan untuk menyembunyikan)"}] },
  { title: "Koleksi & footer", description: "Sesuaikan pengantar katalog dan informasi singkat di bawah halaman.", fields: [
    {key:"collectionTitle",label:"Judul koleksi"},{key:"collectionDescription",label:"Deskripsi koleksi",type:"textarea"},
    {key:"footerDescription",label:"Deskripsi footer",type:"textarea"}] },
  { title: "Kontak & lokasi", description: "Ini alamat toko yang boleh dilihat publik. Alamat gudang untuk ongkir diatur terpisah.", fields: [
    {key:"contactEmail",label:"Email publik"},{key:"contactPhone",label:"Nomor kontak"},
    {key:"storeAddress",label:"Alamat toko publik",type:"textarea"},{key:"locationTitle",label:"Judul bagian lokasi"},
    {key:"locationDescription",label:"Deskripsi lokasi",type:"textarea"},{key:"locationImage",label:"Foto toko",type:"image"},
    {key:"mapsUrl",label:"Tautan Google Maps / peta HTTPS"}] },
];

export default function WebsiteSettingsPage() {
  const { updateSettings } = useSiteSettings();
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(defaultSiteSettings);
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const dirty = saved !== "" && JSON.stringify(form) !== saved;
  const uploadImage = async (key: keyof SiteSettings, file: File) => {
    if(file.size > 2 * 1024 * 1024) { setError("Ukuran gambar maksimal 2 MB."); return; }
    setUploading(true); setError(""); setNotice("");
    try {
      const payload = new FormData(); payload.append("file",file);
      const response = await fetch("/api/admin/site-media",{method:"POST",body:payload});
      const body = await response.json();
      if(!response.ok) throw Error(body.error || "Gagal mengunggah gambar.");
      setForm(previous=>({...previous,[key]:body.url}));
      setNotice("Gambar diunggah. Klik Simpan perubahan untuk menggunakannya di toko.");
    } catch(err) { setError(err instanceof Error ? err.message : "Unggah gagal."); }
    finally { setUploading(false); }
  };
  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/settings", {cache:"no-store"});
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Pengaturan gagal dimuat.");
      const value = siteSettingsSchema.parse(body.data);
      setForm(value); setSaved(JSON.stringify(value));
    } catch { setError("Pengaturan tidak dapat dimuat. Periksa koneksi lalu coba lagi."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if(dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload",warn); return () => window.removeEventListener("beforeunload",warn);
  },[dirty]);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setNotice(""); setError(""); setErrors({});
    const parsed = siteSettingsSchema.safeParse(form);
    if (!parsed.success) {
      const issues: Record<string,string> = {};
      for(const issue of parsed.error.issues) issues[issue.path.join(".")] = issue.message;
      setErrors(issues); setError("Ada isian yang belum valid. Periksa kolom bertanda merah."); return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/settings", {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(parsed.data)});
      const body = await response.json();
      if(!response.ok) throw Error(body.error || "Pengaturan gagal disimpan.");
      setForm(parsed.data); setSaved(JSON.stringify(parsed.data)); updateSettings(parsed.data); router.refresh();
      setNotice("Pengaturan berhasil disimpan. Buka atau muat ulang halaman toko untuk melihat hasilnya.");
    } catch(err) { setError(err instanceof Error ? err.message : "Pengaturan gagal disimpan."); }
    finally { setBusy(false); }
  };
  const field = (f: Field) => <div key={f.key} className="space-y-2">
    <label htmlFor={f.key} className="block text-sm font-semibold">{f.label}</label>
    <div className="flex gap-3">
      {f.type === "color" && <input aria-label={`Pilih ${f.label}`} type="color" value={/^#[0-9a-f]{6}$/i.test(String(form[f.key])) ? String(form[f.key]) : "#000000"} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border p-1"/>}
      {f.type === "textarea" ? <textarea id={f.key} rows={3} value={String(form[f.key])} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="w-full rounded-xl border p-3 text-sm"/> :
        <input id={f.key} value={String(form[f.key])} onChange={e=>setForm({...form,[f.key]:e.target.value})} className="min-w-0 w-full rounded-xl border p-3 text-sm" placeholder={f.type === "image" ? "https://... atau /logo.png" : undefined}/>}
    </div>
    {f.type === "image" && <><label className="block text-xs text-slate-500">Unggah gambar (PNG, JPG, WEBP, GIF, ICO; maks. 2 MB)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,.ico" className="mt-2 block w-full text-xs" onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void uploadImage(f.key,file);}}/></label><p className="text-xs text-slate-500">Atau gunakan tautan HTTPS / file di folder public. Kosongkan untuk menyembunyikan.</p>{form[f.key] && !errors[f.key] && <img src={String(form[f.key])} alt={`Pratinjau ${f.label}`} className="h-20 max-w-full rounded-lg border bg-slate-100 object-contain"/>}</>}
    {errors[f.key] && <p className="text-sm text-red-600">{errors[f.key]}</p>}
  </div>;
  return <main className="min-h-screen bg-slate-50 p-4 md:p-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600"><Palette size={16}/> Identitas & tampilan</p><h1 className="text-3xl font-bold tracking-tight">Pengaturan Website</h1><p className="mt-2 text-sm text-slate-500">Jadikan toko ini milikmu. Semua perubahan tersimpan setelah menekan Simpan.</p></div><Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold">Lihat toko <ExternalLink size={16}/></Link></div>
      {loading && <p role="status">Memuat pengaturan…</p>}
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}{!saved && <button className="ml-3 underline" onClick={()=>void load()}>Coba lagi</button>}</div>}
      {notice && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
      {!loading && saved && <form onSubmit={submit} className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
        <fieldset disabled={busy || uploading} className="min-w-0 space-y-6">
          {groups.map(group=><section key={group.title} className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">{group.title}</h2><p className="mb-6 mt-1 text-sm text-slate-500">{group.description}</p><div className="grid gap-5 sm:grid-cols-2">{group.fields.map(field)}</div>
            {group.title.startsWith("Banner") && <label className="mt-6 block text-sm font-semibold">Kegelapan overlay: {form.heroOverlay}%<input type="range" min={0} max={90} value={form.heroOverlay} onChange={e=>setForm({...form,heroOverlay:Number(e.target.value)})} className="mt-3 block w-full"/></label>}
            {group.title.startsWith("Kontak") && <label className="mt-5 flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.showLocation} onChange={e=>setForm({...form,showLocation:e.target.checked})}/> Tampilkan bagian lokasi di halaman utama</label>}
          </section>)}
          <section className="rounded-2xl border bg-white p-6"><h2 className="mb-5 text-lg font-bold">Media sosial</h2><div className="grid gap-5 sm:grid-cols-2">{Object.entries(form.socialLinks).map(([name,value])=><label key={name} className="text-sm font-semibold capitalize">{name}<input value={value} onChange={e=>setForm({...form,socialLinks:{...form.socialLinks,[name]:e.target.value}})} placeholder="https://..." className="mt-2 w-full rounded-xl border p-3 font-normal"/>{errors[`socialLinks.${name}`] && <span className="text-red-600">{errors[`socialLinks.${name}`]}</span>}</label>)}</div></section>
          <section className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold">Pertanyaan umum / FAQ</h2><label className="my-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={form.showFaq} onChange={e=>setForm({...form,showFaq:e.target.checked})}/>Tampilkan FAQ</label>{field({key:"faqTitle",label:"Judul FAQ"})}
            <div className="mt-5 space-y-4">{form.faqItems.map((item,i)=><div key={i} className="rounded-xl border bg-slate-50 p-4"><div className="mb-3 flex justify-between"><span className="text-xs font-bold text-slate-500">PERTANYAAN {i+1}</span><button aria-label={`Hapus pertanyaan ${i+1}`} type="button" onClick={()=>setForm({...form,faqItems:form.faqItems.filter((_,n)=>n!==i)})}><Trash2 size={16}/></button></div><input aria-label={`Pertanyaan ${i+1}`} value={item.question} onChange={e=>setForm({...form,faqItems:form.faqItems.map((x,n)=>n===i?{...x,question:e.target.value}:x)})} className="mb-3 w-full rounded-lg border bg-white p-3 text-sm"/><textarea aria-label={`Jawaban ${i+1}`} rows={3} value={item.answer} onChange={e=>setForm({...form,faqItems:form.faqItems.map((x,n)=>n===i?{...x,answer:e.target.value}:x)})} className="w-full rounded-lg border bg-white p-3 text-sm"/>{(errors[`faqItems.${i}.question`] || errors[`faqItems.${i}.answer`]) && <p className="text-sm text-red-600">Pertanyaan dan jawaban wajib diisi, sesuai batas panjang.</p>}</div>)}</div>
            <button type="button" disabled={form.faqItems.length>=20} onClick={()=>setForm({...form,faqItems:[...form.faqItems,{question:"",answer:""}]})} className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-700"><Plus size={16}/>Tambah pertanyaan</button>
          </section>
          <ReviewSettings settings={form} onChange={patch=>setForm(previous=>({...previous,...patch}))} errors={errors}/>
        </fieldset>
        <aside className="space-y-5 xl:sticky xl:top-6">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><p className="border-b p-4 text-xs font-bold uppercase tracking-widest text-slate-500">Pratinjau perubahan</p><div style={{background:form.backgroundColor,color:form.textColor}}>
            <div className="flex items-center gap-3 p-4">{form.logoUrl && <img src={form.logoUrl} alt="Logo pratinjau" className="h-8 max-w-24 object-contain"/>}<strong className="truncate text-sm">{form.siteName}</strong></div>
            <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-slate-900 text-center text-white">{form.heroImage && <img alt="" src={form.heroImage} className="absolute inset-0 h-full w-full object-cover"/>}<div className="absolute inset-0 bg-black" style={{opacity:form.heroOverlay/100}}/><div className="relative p-6">{form.announcement && <p className="mb-3 text-xs">{form.announcement}</p>}<h3 className="text-2xl font-bold">{form.heroTitle}</h3><p className="mt-3 text-sm">{form.heroDescription}</p><span className="mt-5 inline-block rounded-lg px-4 py-2 text-sm font-bold" style={{background:form.primaryColor,color:form.buttonTextColor}}>{form.heroButtonText}</span></div></div>
            <div className="p-6"><h3 className="font-bold">{form.collectionTitle}</h3><p className="mt-2 text-sm opacity-70">{form.collectionDescription}</p></div><div className="p-6 text-sm" style={{background:form.footerColor,color:form.footerTextColor}}><strong>{form.siteName}</strong><p className="mt-2 opacity-80">{form.footerDescription}</p></div>
          </div></div>
          <div className="rounded-2xl border bg-white p-5"><p className="mb-4 text-sm text-slate-500" role="status">{dirty ? "Ada perubahan yang belum disimpan." : "Pengaturan sesuai data tersimpan."}</p><button disabled={busy || uploading || !dirty} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50"><Save size={18}/>{busy ? "Menyimpan…" : "Simpan perubahan"}</button><button disabled={busy || uploading} type="button" onClick={()=>{setForm(defaultSiteSettings);setNotice("");setErrors({});}} className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-slate-500"><RotateCcw size={14}/>Gunakan tampilan awal</button><p className="mt-3 text-xs text-slate-400">Tampilan awal hanya diterapkan setelah disimpan.</p><Link href="/dashboard/settings/shipping" className="mt-5 block border-t pt-4 text-sm font-semibold text-blue-700">Atur alamat pengiriman →</Link></div>
        </aside>
      </form>}
    </div>
  </main>;
}
