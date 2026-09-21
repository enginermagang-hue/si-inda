# SIINDAH — Microsite Layanan Dapodik (Nuxt 4 + Nuxt UI)

Microsite informasi + pelayanan pendataan Dapodik: Statistik, Informasi (surat/link/berita),
PTK, Peserta Didik, Sarana Prasarana, SOP (link Google Drive), dan Pengaduan.
Pengunjung tanpa akun; hanya admin yang login untuk mengelola konten.

> Riwayat aplikasi sebelumnya (Vue SPA + Hono) tersimpan di branch
> [`arsip-vite-hono`](https://github.com/enginermagang-hue/si-inda/tree/arsip-vite-hono).

## Arsitektur

- **Frontend**: Nuxt 4 + Nuxt UI v4 (`app/` — pages, layouts, components, stores).
- **Backend**: Nuxt server routes (`server/api/`) — Nitro, tanpa framework tambahan.
- **Database**: Drizzle ORM + libSQL. Lokal: SQLite `dev.db`. Production: Turso cloud.
- **File PDF surat**: driver `local` (`public/uploads/`, dev) atau `dropbox` (production).

## Menjalankan development

```powershell
npm install
Copy-Item .env.example .env   # sekali saja, lalu isi bila perlu
npm run db:migrate            # sekali saja (atau setelah ada migrasi baru)
npm run db:seed               # sekali saja: admin/admin123 + konten awal
npm run dev                   # http://localhost:3000
```

Login admin: `http://localhost:3000/admin/login`
(username `admin`, password `admin123` — wajib diganti saat login pertama).

## Skrip penting

| Perintah | Fungsi |
|---|---|
| `npm run dev` | dev server (frontend + API satu origin) |
| `npm run build` | production build (Nitro) |
| `npx nuxt typecheck` | type-check |
| `npm run lint` | eslint |
| `npm run db:generate` | buat migrasi baru setelah ubah `server/db/schema.ts` |
| `npm run db:migrate` | jalankan migrasi (`dev.db` lokal / Turso bila env diisi) |
| `npm run db:seed` | seed admin + 7 halaman + settings + statistik awal |
| `npm run test:unit` | vitest |
| `npm run test:e2e` | playwright (Chromium) |

## Struktur database (8 tabel, `server/db/schema.ts`)

`admins`, `settings` (termasuk `sop_drive_url`), `content_pages` (7 halaman Syarat…),
`statistics` (satuan_pendidikan, peserta_didik, guru, tendik — tanpa PTK),
`letters` (+ `dropbox_path`), `info_links`, `breaking_news`, `complaints`.

## Deploy ke Vercel

Framework Nuxt terdeteksi otomatis (preset Nitro). Isi Environment Variables
(Production + Preview + Development):

| Key | Contoh |
|---|---|
| `NUXT_JWT_SECRET` | string acak ≥ 32 karakter (wajib baru!) |
| `NUXT_TURSO_URL` | `libsql://…turso.io` |
| `NUXT_TURSO_AUTH_TOKEN` | token Turso |
| `NUXT_STORAGE_DRIVER` | `dropbox` |
| `NUXT_DROPBOX_APP_KEY/APP_SECRET/REFRESH_TOKEN/FOLDER` | kredensial Dropbox |
| `NUXT_ADMIN_*` | hanya bila ingin seed ulang via lokal |

Migrasi production dijalankan lokal: isi env Turso di shell lalu `npm run db:migrate`.
Uji production: login admin → upload 1 PDF → buka link PDF → submit 1 pengaduan.
