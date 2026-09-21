import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const now = () => new Date().toISOString()

/** M1 — akun admin (satu-satunya pengguna yang bisa login). */
export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  /** 1 = wajib ganti password saat login pertama. */
  mustChangePassword: integer('must_change_password').notNull().default(1),
  createdAt: text('created_at').notNull().$defaultFn(now),
})

/** M2 — pengaturan situs key-value (nama situs, link SOP Drive, kontak, footer). */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
})

/**
 * M3 — halaman konten generik untuk semua submenu "Syarat ...".
 * menuGroup: 'ptk' | 'peserta_didik' | 'sarana'
 */
export const contentPages = sqliteTable('content_pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  menuGroup: text('menu_group').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  isPublished: integer('is_published').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(now),
  updatedAt: text('updated_at').notNull().$defaultFn(now),
})

/**
 * M4 — angka Statistik Dapodik (input manual admin per periode).
 * category: 'satuan_pendidikan' | 'peserta_didik' | 'guru' | 'tendik'
 * Hanya baris isCurrent=1 yang tampil di publik.
 */
export const statistics = sqliteTable('statistics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category').notNull(),
  /** Opsional, mis. SD/SMP/SMA. NULL = angka total. */
  jenjang: text('jenjang'),
  label: text('label').notNull(),
  value: integer('value').notNull().default(0),
  period: text('period').notNull(),
  isCurrent: integer('is_current').notNull().default(0),
  updatedAt: text('updated_at').notNull().$defaultFn(now),
})

/** M5 — Surat Informasi Dapodik (metadata + file PDF di server/uploads). */
export const letters = sqliteTable('letters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nomorSurat: text('nomor_surat').notNull(),
  judul: text('judul').notNull(),
  tanggalSurat: text('tanggal_surat').notNull(),
  /** URL publik file: path relatif lokal (uploads/...) atau URL Dropbox. */
  filePath: text('file_path'),
  /** M9 — path internal Dropbox untuk hapus (NULL untuk driver lokal). */
  dropboxPath: text('dropbox_path'),
  isPublished: integer('is_published').notNull().default(1),
  createdAt: text('created_at').notNull().$defaultFn(now),
})

/** M6 — Link Informasi Dapodik. */
export const infoLinks = sqliteTable('info_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: integer('is_published').notNull().default(1),
})

/** M7 — Breaking News (ticker homepage; tampil selama aktif & belum kedaluwarsa). */
export const breakingNews = sqliteTable('breaking_news', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body'),
  isActive: integer('is_active').notNull().default(1),
  publishedAt: text('published_at').notNull().$defaultFn(now),
  expiresAt: text('expires_at'),
})

/**
 * M8 — Pengaduan / penyampaian kendala Dapodik dari pengunjung.
 * status: 'baru' | 'diproses' | 'selesai'
 */
export const complaints = sqliteTable('complaints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  kontak: text('kontak').notNull(),
  kategori: text('kategori').notNull().default('Lainnya'),
  isi: text('isi').notNull(),
  status: text('status').notNull().default('baru'),
  adminNote: text('admin_note'),
  createdAt: text('created_at').notNull().$defaultFn(now),
  updatedAt: text('updated_at').notNull().$defaultFn(now),
})
