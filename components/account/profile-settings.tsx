"use client";
import { useCallback,useEffect,useState,type FormEvent } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Camera,Save,Mail,MapPin,Plus,Pencil,Trash2,ShieldCheck,UserRound } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { profileInput,addressInput,emailChangeInput,type ProfileResponse,type SavedAddress } from "@/lib/account/profile";

const input="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const card="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7";
const emptyAddress={label:"",recipient:"",phone:"",addressLine:"",province:"",city:"",district:"",postalCode:"",isDefault:false};
async function requestAccount(path:string,init:RequestInit={}) {
  const response=await fetch(path,{...init,cache:"no-store"});
  const body=await response.json().catch(()=>({}));
  if(response.status===401){window.location.replace("/account/login");throw Error("Silakan masuk kembali.");}
  if(!response.ok)throw Error(body.error||"Perubahan belum dapat diproses. Coba lagi.");
  return body;
}
const json=(method:string,data:unknown):RequestInit=>({method,headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});

export function ProfileSettings() {
  const {update:updateSession}=useSession();
  const [data,setData]=useState<ProfileResponse|null>(null);
  const [personal,setPersonal]=useState({name:"",phone:""});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [address,setAddress]=useState(emptyAddress),[editing,setEditing]=useState<string|null>(null),[showAddress,setShowAddress]=useState(false);
  const [email,setEmail]=useState(""),[password,setPassword]=useState("");
  const load=useCallback(async(reset=true)=>{
    const body:ProfileResponse=await requestAccount("/api/account/profile");
    setData(body);if(reset)setPersonal({name:body.profile.name,phone:body.profile.phone});
  },[]);
  useEffect(()=>{void load().catch(()=>setError("Profil belum dapat dimuat. Periksa koneksi lalu coba lagi.")).finally(()=>setLoading(false));},[load]);
  const change=async(action:()=>Promise<unknown>,message:string,reset=false)=>{
    if(busy)return;setBusy(true);setError("");
    try{await action();await load(reset);toast.success(message);}
    catch(cause){const message=cause instanceof Error&&!(cause instanceof TypeError)?cause.message:"Koneksi bermasalah. Coba lagi.";setError(message);toast.error(message);}
    finally{setBusy(false);}
  };
  const saveProfile=(event:FormEvent)=>{
    event.preventDefault();const parsed=profileInput.safeParse(personal);
    if(!parsed.success){toast.error("Periksa nama dan nomor telepon.");return;}
    void change(async()=>{await requestAccount("/api/account/profile",json("PATCH",parsed.data));await updateSession();},"Profil berhasil disimpan.",true);
  };
  const upload=(file:File)=>{
    if(file.size>1048576){toast.error("Ukuran foto maksimal 1 MB.");return;}
    void change(async()=>{const form=new FormData();form.append("file",file);await requestAccount("/api/account/avatar",{method:"POST",body:form});},"Foto profil diperbarui.");
  };
  const editAddress=(item?:SavedAddress)=>{
    setEditing(item?.id??null);setAddress(item?{label:item.label,recipient:item.recipient,phone:item.phone,addressLine:item.addressLine,province:item.province,city:item.city,district:item.district,postalCode:item.postalCode,isDefault:item.isDefault}:{...emptyAddress,recipient:data?.profile.name||"",phone:data?.profile.phone||"",isDefault:!data?.addresses.length});setShowAddress(true);
  };
  const saveAddress=(event:FormEvent)=>{
    event.preventDefault();const parsed=addressInput.safeParse(address);
    if(!parsed.success){toast.error("Lengkapi alamat, penerima, telepon, dan kode pos 5 angka.");return;}
    void change(async()=>{await requestAccount(editing?`/api/account/addresses/${encodeURIComponent(editing)}`:"/api/account/addresses",json(editing?"PATCH":"POST",parsed.data));setShowAddress(false);},"Alamat berhasil disimpan.");
  };
  const requestEmail=async(event:FormEvent)=>{
    event.preventDefault();const parsed=emailChangeInput.safeParse({email,password});
    if(!parsed.success){toast.error("Email baru dan password saat ini wajib diisi.");return;}
    if(busy)return;setBusy(true);setError("");
    try{const body=await requestAccount("/api/account/change-email",json("POST",parsed.data));setPassword("");setEmail("");toast.success(body.message,{duration:9000});}
    catch(cause){const message=cause instanceof Error&&!(cause instanceof TypeError)?cause.message:"Permintaan gagal. Coba lagi.";setError(message);toast.error(message);}
    finally{setBusy(false);}
  };
  const retry=()=>{setLoading(true);setError("");void load().catch(()=>setError("Profil belum dapat dimuat.")).finally(()=>setLoading(false));};
  return <main className="min-h-screen bg-[#f6f9ff] px-4 pb-16 pt-28 sm:pt-32"><div className="mx-auto max-w-5xl">
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Akun pembeli</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Profil saya</h1><p className="mt-2 text-sm text-slate-500">Kelola informasi pribadi, alamat, dan keamanan akunmu.</p></div><AccountMenu/>
    {error&&<div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}{!data&&<button onClick={retry} className="ml-3 font-semibold underline">Coba lagi</button>}</div>}
    {loading&&<p role="status" className="rounded-2xl border bg-white p-8 text-sm text-slate-500">Memuat informasi akun…</p>}
    {!loading&&data&&<div className="space-y-6">
      <section className={card}><div className="mb-6 flex items-center gap-2"><UserRound size={20} className="text-blue-600"/><h2 className="text-lg font-bold">Informasi pribadi</h2></div><div className="grid gap-8 md:grid-cols-[180px_1fr]">
        <div><div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-3xl font-bold text-blue-600">{data.profile.avatarUrl?<img src={data.profile.avatarUrl} alt="Foto profil saya" className="h-full w-full object-cover"/>:Array.from(data.profile.name)[0]?.toUpperCase()}</div><label className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-700"><Camera size={16}/>Ubah foto<input disabled={busy} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)upload(file);}}/></label><p className="mt-2 text-xs leading-5 text-slate-400">JPG, PNG, WEBP.<br/>Maksimal 1 MB.</p>{data.profile.hasAvatar&&<button disabled={busy} onClick={()=>void change(()=>requestAccount("/api/account/avatar",{method:"DELETE"}),"Foto profil dihapus.")} className="mt-3 text-xs text-red-600">Hapus foto</button>}</div>
        <form onSubmit={saveProfile}><fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Nama lengkap<input required minLength={2} maxLength={100} autoComplete="name" value={personal.name} onChange={e=>setPersonal({...personal,name:e.target.value})} className={input}/></label><label className="text-sm font-semibold">Nomor telepon<input type="tel" maxLength={20} autoComplete="tel" placeholder="08xxxxxxxxxx" value={personal.phone} onChange={e=>setPersonal({...personal,phone:e.target.value})} className={input}/></label><div className="sm:col-span-2"><p className="text-sm font-semibold">Email login</p><p className="mt-2 break-all text-sm text-slate-600">{data.profile.email}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><ShieldCheck size={13}/>Email terverifikasi</span></div><button type="submit" className="storefront-btn-primary inline-flex w-fit items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50"><Save size={16}/>{busy?"Memproses…":"Simpan profil"}</button></fieldset></form>
      </div></section>
      <section className={card}><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-bold"><MapPin size={20} className="text-blue-600"/>Alamat tersimpan</h2><p className="mt-2 text-xs leading-6 text-slate-500">Kelola alamat penerima. Perubahan di sini tidak mengubah alamat pada pesanan yang sudah dibuat.</p></div><button disabled={busy||data.addresses.length>=20} onClick={()=>editAddress()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"><Plus size={16}/>Tambah alamat</button></div>
        {!data.addresses.length&&!showAddress&&<p className="mt-6 rounded-xl border border-dashed bg-slate-50 p-7 text-center text-sm text-slate-500">Belum ada alamat tersimpan.</p>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{data.addresses.map(item=><article key={item.id} className="rounded-xl border p-5"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.label||"Alamat penerima"}</h3>{item.isDefault&&<span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">Utama</span>}</div><p className="mt-3 text-sm font-semibold">{item.recipient}</p><p className="mt-1 text-xs text-slate-500">{item.phone}</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.addressLine}<br/>{[item.district,item.city,item.province,item.postalCode].filter(Boolean).join(", ")}</p><div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold"><button disabled={busy} onClick={()=>editAddress(item)} className="flex items-center gap-1 text-blue-700"><Pencil size={13}/>Ubah</button>{!item.isDefault&&<button disabled={busy} onClick={()=>{const {id,...fields}=item;void change(()=>requestAccount(`/api/account/addresses/${encodeURIComponent(id)}`,json("PATCH",{...fields,isDefault:true})),"Alamat utama diperbarui.");}} className="text-blue-700">Jadikan utama</button>}<button disabled={busy} onClick={()=>{if(window.confirm("Hapus alamat ini dari akunmu?"))void change(()=>requestAccount(`/api/account/addresses/${encodeURIComponent(item.id)}`,{method:"DELETE"}),"Alamat dihapus.");}} className="flex items-center gap-1 text-red-600"><Trash2 size={13}/>Hapus</button></div></article>)}</div>
        {showAddress&&<form onSubmit={saveAddress} className="mt-6 rounded-xl bg-slate-50 p-5"><h3 className="mb-5 font-bold">{editing?"Ubah alamat":"Alamat baru"}</h3><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">{([{key:"label",label:"Label (opsional)",hint:"Rumah / kantor"},{key:"recipient",label:"Nama penerima"},{key:"phone",label:"Nomor telepon penerima"},{key:"province",label:"Provinsi"},{key:"city",label:"Kota / Kabupaten"},{key:"district",label:"Kecamatan"},{key:"postalCode",label:"Kode pos",hint:"5 angka"}] as const).map(field=><label key={field.key} className="text-sm font-semibold">{field.label}<input required={field.key!=="label"} maxLength={field.key==="label"?60:field.key==="postalCode"?5:field.key==="phone"?20:100} value={address[field.key]} onChange={e=>setAddress({...address,[field.key]:e.target.value})} className={input}/></label>)}<label className="text-sm font-semibold sm:col-span-2">Alamat lengkap<textarea required minLength={8} maxLength={300} rows={3} value={address.addressLine} onChange={e=>setAddress({...address,addressLine:e.target.value})} className={input}/></label><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={address.isDefault} onChange={e=>setAddress({...address,isDefault:e.target.checked})}/>Jadikan alamat utama</label><div className="flex gap-4 sm:col-span-2"><button type="submit" className="storefront-btn-primary rounded-xl px-5 py-3 text-sm font-bold">Simpan alamat</button><button type="button" onClick={()=>setShowAddress(false)} className="text-sm text-slate-500">Batal</button></div></fieldset></form>}
      </section>
      <section className={card}><h2 className="flex items-center gap-2 text-lg font-bold"><Mail size={20} className="text-blue-600"/>Email & keamanan</h2><p className="mt-3 text-sm leading-7 text-slate-500">Email baru baru akan digunakan setelah tautan verifikasi dikonfirmasi. Setelah perubahan berhasil, semua sesi lama berakhir dan kamu perlu masuk ulang.</p><form onSubmit={requestEmail} className="mt-5"><fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold">Email baru<input required type="email" maxLength={200} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className={input}/></label><label className="text-sm font-semibold">Password saat ini<input required type="password" maxLength={128} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className={input}/></label><button type="submit" className="w-fit rounded-xl border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700">Kirim verifikasi email baru</button></fieldset></form><div className="mt-7 border-t pt-5"><p className="text-sm font-semibold">Ingin mengubah password?</p><Link href="/account/forgot-password" className="mt-2 inline-block text-sm font-medium text-blue-700 underline">Minta tautan reset password</Link></div></section>
    </div>}
  </div></main>;
}
