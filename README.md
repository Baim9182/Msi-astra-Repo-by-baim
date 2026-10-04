<div align="center">

<img src="https://i.ibb.co.com/twHc7kkk/Proyek-Baru-14-B060999.png" alt="MSI ASTRA" width="120" height="120" style="border-radius: 50%;" />

# MSI ASTRA

### Jasa, Produk Digital & Project Custom — Semua di Satu Tempat

<br>

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![GitHub Gist](https://img.shields.io/badge/GitHub-Gist-181717?style=for-the-badge&logo=github&logoColor=white)](https://gist.github.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](./LICENSE)

<br>

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Mobile First](https://img.shields.io/badge/Mobile-First-6c7cff?style=flat-square&logo=android&logoColor=white)](https://developer.mozilla.org)

<br>

**MSI ASTRA** adalah platform web single-page yang menampilkan jasa, produk digital, dan metode pembayaran dengan sistem admin panel terintegrasi. Dibangun dengan HTML, CSS, dan JavaScript murni, serta ditenagai oleh GitHub Gist sebagai database dan Cloudflare Workers sebagai backend proxy.

<br>

[Live Demo](#) | [Dokumentasi](#cara-kerja) | [Report Bug](https://github.com/Baim9182/Msi-astra-Repo-by-baim/issues) | [WhatsApp](https://wa.me/6281358070254)

</div>

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Quick Start](#quick-start)
- [Admin Access](#admin-access)
- [Struktur Project](#struktur-project)
- [Kustomisasi](#kustomisasi)
- [Cara Kerja](#cara-kerja)
- [Keamanan](#keamanan)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)
- [Author](#author)

---

## Fitur Utama

### Antarmuka
- 6 tema warna (Default, Blue, Purple, Red, Green, Gold)
- Mobile-first responsive design
- Rotating hero text dan quote rotator
- Smooth animations dengan CSS GPU-accelerated
- Dark mode secara default
- Landscape mode support untuk HP
- Background image customizable

### Fitur Bisnis
- Katalog jasa custom (tambah/edit/hapus)
- Produk digital dengan status
- Payment gateway info (QRIS, GoPay, DANA, dll)
- Status real-time (Tersedia / Off / Maintenance)
- Direct chat via WhatsApp
- Export data ke JSON

### Admin System
- Multi-key authentication (1 main + 2 backup)
- SHA-256 password hashing
- One-time device claim (main key)
- Backup key dengan toggle ON/OFF
- Session 7 hari otomatis
- Force logout seketika
- Device-based session management

### Sistem
- Cloud sync via GitHub Gist
- Serverless backend (Cloudflare Workers)
- Token aman di environment server
- Maintenance mode terintegrasi
- Theme persistence (localStorage)
- Form saran ke Discord webhook
- Auto-sync dari cloud

---

## Teknologi

### Arsitektur
