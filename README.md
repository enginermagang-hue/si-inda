# SIINDAH — Microsite Layanan Dapodik

Microsite informasi + pelayanan pendataan Dapodik: Statistik, Informasi (surat/link/berita),
PTK, Peserta Didik, Sarana Prasarana, SOP (link Google Drive), dan Pengaduan.
Pengunjung tanpa akun; hanya admin yang login untuk mengelola konten.

## Arsitektur

- **Frontend** (`src/`): Vue 3 + Vite + Tailwind CSS v4, SPA dengan Vue Router.
- **Backend** (`server/`): API Hono (Node.js) + Drizzle ORM + libSQL.
- **Database**: SQLite file lokal saat development (`server/dev.db`),
  Turso cloud saat production (via `TURSO_URL` + `TURSO_AUTH_TOKEN`).

## Menjalankan development

Terminal 1 — backend (port 3001):

```powershell
cd server
npm install
npm run migrate   # sekali saja (atau setelah ada migrasi baru)
npm run seed      # sekali saja: admin/admin123 + konten awal
npm run dev
```

Terminal 2 — frontend (port 5173, `/api` & `/uploads` diproxy ke backend):

```powershell
npm install
npm run dev
```

Buka `http://localhost:5173`. Login admin: `http://localhost:5173/admin/login`
(username `admin`, password `admin123` — wajib diganti saat login pertama).

## Skrip penting

| Perintah | Lokasi | Fungsi |
|---|---|---|
| `npm run dev` | root / server | dev server frontend / backend |
| `npm run build` | root | type-check + production build |
| `npm run migrate` | server | jalankan migrasi `drizzle/` ke database |
| `npm run seed` | server | seed admin + 7 halaman + settings + statistik awal |
| `npm run db:generate` | server | buat file migrasi baru setelah ubah `src/db/schema.ts` |
| `npx vitest run` | root | unit test |
| `npx playwright test` | root | e2e (butuh kedua dev server jalan) |

## Struktur database (8 tabel, lihat `server/src/db/schema.ts`)

`admins`, `settings` (termasuk `sop_drive_url`), `content_pages` (7 halaman Syarat…),
`statistics` (satuan_pendidikan, peserta_didik, guru, tendik — tanpa PTK),
`letters` (PDF di `server/uploads/`), `info_links`, `breaking_news`, `complaints`.

## Production (Turso)

1. Buat database di [turso.tech](https://turso.tech), salin URL + token.
2. Di server production, set env: `TURSO_URL`, `TURSO_AUTH_TOKEN`,
   `JWT_SECRET` (acak ≥ 32 karakter), `NODE_ENV=production`, opsional `FRONTEND_ORIGIN`.
3. `npm run migrate && npm run seed && npm run start`.
4. Serve frontend (`dist/`) dan API dari origin yang sama (reverse proxy).

## Deploy ke Vercel (1 project, DB Turso, file via Dropbox)

Arsitektur: frontend statis + function serverless `api/index.ts` (Hono via
`hono/vercel`) dalam satu domain, sehingga cookie admin tetap same-origin.

1. **Dropbox** (sekali saja): buat App di Dropbox App Console (permission
   `files.content.write` + `sharing.write`), catat App Key/Secret, lalu OAuth
   authorization-code flow untuk mendapatkan **refresh token**:
   - Buka di browser (ganti APP_KEY):
     `https://www.dropbox.com/oauth2/authorize?client_id=APP_KEY&response_type=code&token_access_type=offline`
   - Tukar `CODE` via curl:
     `curl -u APP_KEY:APP_SECRET https://api.dropboxapi.com/oauth2/token -d grant_type=authorization_code -d code=CODE`
   - Simpan `refresh_token` dari respons.
2. **Import repo** di `vercel.com/new` (root `si-inda`), isi env
   (Production + Preview + Development): `JWT_SECRET` (baru, acak),
   `TURSO_URL`, `TURSO_AUTH_TOKEN`, `STORAGE_DRIVER=dropbox`,
   `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN`,
   `DROPBOX_FOLDER=/siindah/surat`.
3. Deploy. Migrasi berikut (`server/drizzle/0001_*`, kolom `dropbox_path`)
   sudah diterapkan ke Turso — untuk skema berikutnya jalankan
   `npm run migrate` lokal sebelum deploy.
4. Uji production: login admin → upload 1 PDF → buka link PDF (URL Dropbox
   `?raw=1`) → submit pengaduan → buka `/ptk/<slug>` langsung (rewrite SPA).
