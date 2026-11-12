import { z } from "zod";
const url = z.string().max(2048).refine(v => v === "" || /^\/(?!\/)[^\\\s]*$/.test(v) || /^https:\/\/[^\s\\]+$/i.test(v), "Gunakan URL HTTPS atau path /gambar.png");
const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Gunakan warna hex #2563eb");
export const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(100), siteDescription: z.string().max(300),
  logoUrl: url, faviconUrl: url, primaryColor: color, buttonTextColor: color,
  backgroundColor: color, textColor: color, footerColor: color, footerTextColor: color,
  heroImage: url, heroTitle: z.string().trim().min(1).max(150), heroDescription: z.string().max(600),
  heroButtonText: z.string().trim().min(1).max(60), heroButtonLink: url, heroOverlay: z.number().min(0).max(90),
  announcement: z.string().max(200), collectionTitle: z.string().trim().min(1).max(150), collectionDescription: z.string().max(600),
  footerDescription: z.string().max(600), contactEmail: z.union([z.literal(""), z.email().max(200)]),
  contactPhone: z.string().max(50), storeAddress: z.string().max(500),
  showLocation: z.boolean(), locationTitle: z.string().max(150), locationDescription: z.string().max(600),
  locationImage: url, mapsUrl: z.union([z.literal(""), z.url().refine(v => new URL(v).protocol === "https:", "Gunakan HTTPS")]),
  showFaq: z.boolean(), faqTitle: z.string().max(150),
  faqItems: z.array(z.object({ question: z.string().trim().min(1).max(200), answer: z.string().trim().min(1).max(1500) }).strict()).max(20),
  showReviews: z.boolean(), reviewsTitle: z.string().trim().min(1).max(150),
  reviews: z.array(z.object({ name: z.string().trim().min(1).max(80), rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(600), product: z.string().trim().max(150) }).strict()).max(12),
  socialLinks: z.object({ instagram: url, facebook: url, youtube: url, twitter: url }).strict(),
}).strict();
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export const defaultSiteSettings: SiteSettings = {
  siteName: "Pixel Perfection", siteDescription: "Perangkat pilihan untuk bekerja dan berkreasi.",
  logoUrl: "/logoo.png", faviconUrl: "", primaryColor: "#2563eb", buttonTextColor: "#ffffff",
  backgroundColor: "#f6f9ff", textColor: "#0f172a", footerColor: "#0a0a0a", footerTextColor: "#ffffff",
  heroImage: "/wallpaper.gif", heroTitle: "Perangkat terbaik untuk keseharianmu",
  heroDescription: "Temukan mouse, keyboard, webcam, dan aksesori pilihan untuk melengkapi ruang kerjamu.",
  heroButtonText: "Jelajahi produk", heroButtonLink: "/product", heroOverlay: 50, announcement: "",
  collectionTitle: "Pilihan untuk ruang kerjamu", collectionDescription: "Temukan produk yang sesuai dengan kebutuhan dan gaya kerjamu.",
  footerDescription: "Perangkat dan aksesori pilihan untuk bekerja, belajar, dan berkreasi.",
  contactEmail: "", contactPhone: "", storeAddress: "", showLocation: false,
  locationTitle: "Kunjungi toko kami", locationDescription: "", locationImage: "/store.webp", mapsUrl: "",
  showFaq: true, faqTitle: "Pertanyaan yang sering diajukan",
  showReviews: true, reviewsTitle: "Dari pembeli, untuk pembeli.", reviews: [],
  faqItems: [{ question: "Bagaimana cara memesan?", answer: "Pilih produk, tambahkan ke keranjang, lalu lanjutkan ke checkout." },
    { question: "Di mana saya melihat pesanan?", answer: "Masuk ke akun pembeli dan buka halaman Pesanan Saya." }],
  socialLinks: { instagram: "", facebook: "", youtube: "", twitter: "" },
};
export function decodeSiteSettings(rows: { key: string; value: string }[]): SiteSettings {
  const result = { ...defaultSiteSettings };
  for (const { key, value } of rows) {
    if (!Object.prototype.hasOwnProperty.call(siteSettingsSchema.shape, key)) continue;
    let decoded: unknown = value;
    try { decoded = JSON.parse(value); } catch { /* legacy plain text */ }
    const field = key as keyof SiteSettings;
    const parsed = siteSettingsSchema.shape[field].safeParse(decoded);
    if (parsed.success) Object.assign(result, { [field]: parsed.data });
  }
  return result;
}
