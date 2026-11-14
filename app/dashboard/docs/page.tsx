import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";

const sections = [
  { id: "mulai", title: "1. Persiapan toko", href: "/dashboard/settings", action: "Buka pengaturan website", steps: [
    "Isi nama toko, deskripsi, logo, favicon, warna, judul dan gambar utama. Sesuaikan koleksi, kontak, media sosial, serta FAQ.",
    "Tambahkan ulasan hanya jika sudah ada testimoni pembeli yang boleh ditampilkan. Bagian rating dapat disembunyikan.",
    "Tekan Simpan perubahan. Tombol Gunakan tampilan awal mengisi ulang formulir; hasilnya baru diterapkan setelah disimpan.",
    "Gunakan Lihat toko untuk memeriksa hasil. Perubahan formulir yang belum disimpan belum tampil di toko.",
  ] },
  { id: "pengiriman", title: "2. Atur alamat pengirim", href: "/dashboard/settings/shipping", action: "Atur alamat pengirim", steps: [
    "Isi lokasi asal pengiriman dengan lengkap, termasuk wilayah dan kode pos.",
    "Tentukan titik pada peta atau gunakan lokasi perangkat. Izinkan akses lokasi jika diminta, lalu periksa kembali titiknya.",
    "Simpan alamat sebelum melayani pesanan fisik. Alamat ini digunakan sebagai asal perhitungan pengiriman.",
  ] },
  { id: "produk", title: "3. Kelola produk, kategori dan tag", href: "/dashboard/product", action: "Kelola produk", steps: [
    "Buat kategori dan tag terlebih dahulu melalui tombol Upload pada tabel masing-masing. Gunakan tombol pensil untuk mengubahnya.",
    "Tekan Upload Product. Pada General, pilih jenis Physical atau Digital, isi nama, deskripsi, harga dalam rupiah, stok, kategori dan tag.",
    "Untuk produk fisik, isi berat dalam gram dan dimensi sesuai label formulir. Pada Media, masukkan tautan gambar banner dan galeri.",
    "Tekan Upload untuk membuat produk atau Save Changes saat mengedit. Saat mengedit, status publikasi sebelumnya tetap dipertahankan.",
    "Klik judul produk untuk membuka detail sebenarnya. Gunakan Edit Product untuk memperbarui data dan sakelar Published untuk menampilkan atau menyembunyikan produk di toko.",
    "Gunakan filter judul, urutan harga dan navigasi halaman untuk mencari produk. Untuk menghapus, pilih kotak centang lalu tekan tombol tempat sampah. Penghapusan dapat ditolak jika data masih digunakan.",
  ] },
  { id: "digital", title: "4. Unggah file produk digital", href: "/dashboard/digital-assets", action: "Kelola file digital", steps: [
    "Buat produk berjenis Digital di menu Produk, kemudian buka File Digital.",
    "Pilih berkas untuk produk yang sesuai dan tekan tombol unggah. Periksa batas ukuran dan jenis berkas yang ditampilkan di halaman.",
    "File digital disimpan secara privat. Pembeli yang memenuhi ketentuan pembayaran dapat mengakses unduhan melalui akun mereka.",
    "Jangan menaruh file berbayar pada tautan gambar publik. Gunakan Muat ulang untuk melihat status terbaru setelah unggahan.",
  ] },
  { id: "pesanan", title: "5. Proses pesanan", href: "/dashboard/orders", action: "Buka pesanan", steps: [
    "Pilih filter status atau tekan Refresh untuk memperbarui daftar. Klik nomor pesanan atau tombol detail untuk melihat barang, penerima dan pembayaran.",
    "Pesanan DRAFT atau PENDING PAYMENT belum siap dikirim. Status pembayaran diperbarui dari proses pembayaran Midtrans; dashboard tidak menyediakan tombol untuk memaksanya menjadi PAID.",
    "Untuk pesanan fisik yang memenuhi syarat, isi nama kurir dan layanan lalu tandai siap dikirim (READY).",
    "Setelah paket diserahkan ke ekspedisi, isi nomor resi yang sebenarnya lalu tekan Simpan resi & tandai SHIPPED.",
    "Setelah memastikan paket sudah diterima melalui informasi ekspedisi, tekan Tandai DELIVERED dan konfirmasi. Pengecekan resi dilakukan secara manual.",
    "Pesanan digital tidak membutuhkan kurir. Pesanan campuran dapat memiliki proses pengiriman fisik dan pemenuhan digital yang berbeda.",
  ] },
  { id: "ringkasan", title: "6. Baca ringkasan dashboard", href: "/dashboard", action: "Buka ringkasan", steps: [
    "Pilih periode 7, 30 atau 90 hari. Tekan Perbarui untuk memuat data terbaru. Tanggal menggunakan zona waktu WIB.",
    "Pembayaran diterima adalah pembayaran PAID dalam periode tersebut, termasuk ongkir. Angka ini adalah penerimaan kotor, belum memperhitungkan biaya layanan atau pengembalian dana.",
    "Pesanan masuk mengikuti periode yang dipilih. Menunggu pembayaran dan Perlu diproses menunjukkan antrean saat ini dari seluruh periode.",
    "Grafik pembayaran dan produk terlaris berasal dari transaksi sebenarnya. Klik pesanan terbaru atau produk dengan stok rendah untuk menindaklanjutinya.",
  ] },
  { id: "akun", title: "7. Akun dan bantuan", href: "/", action: "Lihat toko", steps: [
    "Menu akun di bagian bawah sidebar menampilkan identitas admin yang sedang masuk. Pilih Keluar untuk mengakhiri sesi.",
    "Akun pembeli dikelola melalui menu profil pada toko: nama, nomor telepon, foto profil, alamat dan perubahan email dengan verifikasi.",
    "Jika aksi gagal, baca pesan kesalahan dan coba muat ulang. Pastikan koneksi tersedia dan sesi admin masih aktif; masuk kembali bila sesi berakhir.",
    "Jika data belum muncul, periksa status Published pada produk, hasil penyimpanan pengaturan dan status pembayaran pesanan. Jangan mengulangi unggahan atau transaksi sebelum memeriksa hasil sebelumnya.",
  ] },
];

export default function DashboardDocsPage() {
  return <main className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-8">
    <div className="rounded-2xl border bg-white p-6">
      <BookOpen className="mb-4 size-8 text-blue-600" /><h2 className="text-3xl font-bold">Panduan penggunaan dashboard</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Mulai dari menyiapkan toko, mengelola katalog, hingga memproses pesanan. Panduan ini mengikuti fitur yang tersedia pada dashboard saat ini.</p>
      <nav aria-label="Daftar isi panduan" className="mt-5 flex flex-wrap gap-2">{sections.map(section => <a key={section.id} href={"#" + section.id} className="rounded-full border px-3 py-2 text-xs font-medium hover:bg-slate-50">{section.title}</a>)}</nav>
    </div>
    {sections.map(section => <section id={section.id} key={section.id} className="scroll-mt-6 rounded-2xl border bg-white p-5 md:p-6">
      <h2 className="text-xl font-bold">{section.title}</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">{section.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <Link href={section.href} className="mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">{section.action}<ArrowUpRight size={16} /></Link>
    </section>)}
  </main>;
}
