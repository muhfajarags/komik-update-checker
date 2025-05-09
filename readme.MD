# Update Komik Checker

Aplikasi web untuk memantau pembaruan chapter terbaru dari komik yang Anda ikuti di Komiku.id.

## Fitur

- Memantau update komik dari situs Komiku.id
- Antarmuka web yang interaktif dan responsif
- Notifikasi ketika ada chapter baru
- Menyimpan status terakhir pemindaian
- Kemampuan untuk menambahkan komik baru ke daftar pantauan

## Cara Penggunaan

### Prasyarat

Pastikan Anda telah menginstal Python dan paket-paket berikut:

```
pip install flask selenium webdriver-manager
```

### Struktur Folder

Pastikan Anda memiliki struktur folder seperti berikut:

```
/project_folder/
  ├── app.py
  ├── status.csv (akan dibuat otomatis)
  ├── /templates/
  │    └── index.html
  └── /static/
       └── default_cover.png
```

### Langkah-langkah Penggunaan

1. Buat folder `templates` dan `static` di direktori yang sama dengan `app.py`
2. Tempatkan file `index.html` di folder `templates`
3. Tambahkan gambar placeholder bernama `default_cover.png` di folder `static`
4. Jalankan aplikasi dengan perintah:

```
python app.py
```

5. Buka browser dan akses `http://127.0.0.1:5000/`
6. Klik tombol "Periksa Update" untuk memindai komik yang sudah terdaftar
7. Jika ingin menambahkan komik baru, klik tombol "Tambah Komik" dan masukkan URL dari Komiku.id

### Cara Kerja

Aplikasi ini menjalankan script Selenium di backend untuk mengambil informasi tentang chapter terbaru dari setiap komik yang dipantau. Data ini kemudian disimpan dalam file CSV dan ditampilkan di antarmuka web. Setiap kali pengguna memeriksa pembaruan, aplikasi akan membandingkan chapter saat ini dengan chapter yang tersimpan sebelumnya untuk menentukan apakah ada pembaruan.

## Kustomisasi

- Untuk mengubah daftar komik default, edit variabel `MANGA_LIST` di `app.py`
- Untuk mengubah tampilan, Anda dapat memodifikasi file `index.html` dan menambahkan CSS tambahan
