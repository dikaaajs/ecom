# Panduan dashboard

Panduan penggunaan tersedia langsung pada /dashboard/docs, melalui tombol
**Docs** di header, menu **Docs · Panduan** di sidebar, dan menu akun admin.
Halaman ini mengikuti perlindungan sesi admin pada seluruh dashboard.

Panduan membahas persiapan tampilan toko, alamat pengirim, kategori/tag/produk,
gambar, file digital, pemrosesan pesanan fisik, arti metrik, akun dan penanganan
kesalahan. Setiap bagian memiliki tautan ke halaman pengelolaan yang sesuai.

## Kontrol yang dirapikan

- Menu Analytics/Article yang belum tersedia, Quick Create, Get Help, Search,
  serta Account/Billing/Notifications contoh dihapus dari navigasi aktif.
- Nama toko berasal dari pengaturan. Identitas admin berasal dari sesi.
- Tautan logo membuka dashboard; Lihat toko membuka beranda.
- Keluar menghapus sesi dan membuka halaman login admin; kegagalan menampilkan toast.
- Judul produk membuka detail berdasarkan ID, dengan pemeriksaan admin di server,
  data database sebenarnya, penanganan produk tidak ditemukan, dan formulir edit.
- Edit mempertahankan status publikasi dan nilai stok nol. Kategori dan tag dimuat
  ulang saat formulir dibuka. Kegagalan publikasi menampilkan toast.
- Gambar dapat diketik/ditempel sebagai URL, ditambahkan ke galeri, dipratinjau dan
  dihapus melalui tombol yang berlabel, termasuk pada perangkat sentuh.
- Katalog menyediakan muat ulang dan pesan kegagalan. Harga diurutkan sebagai angka.
- Pilihan baris mengikuti ID data agar tidak berpindah ke produk lain saat data berubah.
  Hapus membutuhkan pilihan dan konfirmasi, serta dinonaktifkan selama proses.

Tidak ada perubahan skema database atau pengaturan pembayaran untuk perubahan ini.

## Pemeriksaan

- TypeScript dan production build.
- 17 pengujian regresi akun, login admin, dashboard dan pengaturan.
- Uji HTTP dengan produk/kategori/tag sementara: buat, edit, publikasi, hapus;
  delapan rute dashboard; pembatasan Docs untuk tamu dan non-admin.
- Uji browser: login, Docs, katalog, detail produk sebenarnya, formulir edit,
  tab Media, buka/tutup pratinjau, batal, dan keluar ke login pada origin yang sama.
- Produk yang tidak ditemukan menggunakan mekanisme notFound Next.js.
  Respons streaming dapat berstatus HTTP 200 dengan penanda not-found 404
  pada aliran halaman; jangan mengandalkan status HTTP saja dalam smoke test.
- Semua fixture katalog dan admin sementara dibersihkan setelah pengujian.
  Pesanan, pembayaran dan file digital pembeli tidak diubah oleh uji ini.

## Kartu pratinjau produk

Kolom deskripsi dihapus dari tabel; ringkasannya tetap tersedia pada kartu produk.
Kartu memakai portal agar tidak terpotong oleh area gulir tabel, batas lebar viewport,
batas tinggi area yang tersedia, dan pembungkusan teks tersendiri. Judul, harga,
deskripsi dan tag tidak mewarisi whitespace-nowrap dari sel tabel.
Gambar memakai object-contain; galeri berada di alur normal tanpa posisi negatif.
Area konten dashboard memiliki min-width: 0 sehingga gulir horizontal tetap di tabel.
Pemeriksaan tampilan: kartu selebar 320 px tetap berada di dalam viewport desktop
1280 px dan ponsel 390 px, tidak ada isi horizontal yang keluar dari kartu,
kolom Description tidak dirender, dan tabel produk memiliki gulir sendiri.
Pratinjau juga dapat dibuka melalui fokus keyboard. Akun admin uji dihapus;
produk yang tersimpan tidak diubah.
