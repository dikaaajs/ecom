# Login admin dan notifikasi

Halaman /auth/signin memakai tata letak responsif, identitas toko, formulir
berlabel, pengatur visibilitas password, dan satu toast untuk kegagalan login.
Navbar pembeli disembunyikan pada halaman admin. /auth/login mengarah ke
halaman admin yang sama. Tidak ada perubahan kredensial atau aturan autentikasi.

Toast mengikuti tampilan kartu netral seperti referensi shadcn:
https://ui.shadcn.com/docs/components/base/toast

Implementasinya memakai Sonner yang sudah terpasang, melalui lib/notify.ts
dan components/ui/sonner.tsx. Tidak ada dependensi toast kedua.

| Jenis | Kapan digunakan |
| --- | --- |
| success | Penambahan, perubahan atau penghapusan berhasil dikonfirmasi |
| error / failed | Login, permintaan server, koneksi atau penyimpanan gagal |
| warning | Isian belum valid, ukuran file berlebih, atau izin lokasi tidak tersedia |
| info | Instruksi lanjutan, permintaan verifikasi, tautan unduhan, perubahan keranjang |
| loading | Proses yang sedang berjalan; diganti dengan hasil akhir memakai ID yang sama |

Gunakan impor toast dari lib/notify agar judul, durasi, ikon dan gaya seragam.
Gunakan ID tetap untuk kegagalan yang dapat diulangi agar toast tidak menumpuk.
useToastFeedback menyimpan konteks pesan bila layar membutuhkan status gagal/
coba lagi; pemanggilan dengan string kosong tidak memunculkan toast. Jangan
memanggil notifikasi dari render atau updater React yang dapat diputar ulang.

Notifikasi mencakup katalog/kategori/tag/publikasi, pengaturan website dan gambar,
alamat pengirim, pengiriman pesanan, file digital, profil/foto/alamat pembeli,
alur akun, klaim pesanan, unduhan, keranjang dan pembuatan pesanan.
Kesalahan pada kolom tetap ditampilkan dekat isian untuk membantu koreksi.
Kegagalan memuat halaman juga dapat memiliki layar coba lagi yang tetap terlihat.
Tidak ada toast sukses pada setiap pembacaan otomatis atau polling.
Notifikasi pembayaran hanya menyatakan proses permintaan, bukan klaim bahwa
pembayaran sudah berhasil tanpa status server yang terverifikasi.

## Hasil pemeriksaan

- TypeScript dan production build lulus.
- 17 tes regresi akun, login admin, dashboard dan pengaturan lulus.
- Klasifikasi lima jenis toast, alias failed, deduplikasi ID dan reset kosong lulus.
- Login salah: tepat satu toast error, formulir aktif kembali, tidak berpindah halaman.
- Login admin berhasil tetap membuka dashboard.
- Penambahan/perubahan kategori uji menampilkan success; URL gambar tidak valid
  menampilkan warning; kategori dan admin uji dibersihkan setelah pemeriksaan.
- Desain login diperiksa pada desktop dan layar ponsel 390 × 844.
- Server pengembangan memakai cache baru setelah cache HMR lama bermasalah.
