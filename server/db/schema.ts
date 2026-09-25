import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const now = () => new Date().toISOString()

/** Akun admin (satu-satunya pengguna yang bisa login). */
export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  /** 1 = wajib ganti password saat login pertama. */
  mustChangePassword: integer('must_change_password').notNull().default(1),
  createdAt: text('created_at').notNull().$defaultFn(now),
})

/** Pengaturan situs key-value (nama situs, link SOP Drive, kontak, footer). */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
})

/**
 * Halaman konten generik untuk semua submenu "Syarat ...".
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


export const letters = sqliteTable('letters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nomorSurat: text('nomor_surat').notNull(),
  judul: text('judul').notNull(),
  tanggalSurat: text('tanggal_surat').notNull(),
  deskripsi: text('deskripsi'),
  /** URL publik file: path relatif lokal (uploads/...) atau URL Dropbox. */
  filePath: text('file_path'),
  /** Path internal Dropbox untuk hapus (NULL untuk driver lokal). */
  dropboxPath: text('dropbox_path'),
  isPublished: integer('is_published').notNull().default(1),
  createdAt: text('created_at').notNull().$defaultFn(now),
})

/** Link Informasi Dapodik. */
export const infoLinks = sqliteTable('info_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: integer('is_published').notNull().default(1),
})

/** Breaking News (ticker homepage; tampil selama aktif & belum kedaluwarsa). */
export const breakingNews = sqliteTable('breaking_news', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body'),
  isActive: integer('is_active').notNull().default(1),
  publishedAt: text('published_at').notNull().$defaultFn(now),
  expiresAt: text('expires_at'),
})

/** Gambar Breaking News (multi-gambar dengan deskripsi per berita). */
export const breakingNewsImages = sqliteTable('breaking_news_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  newsId: integer('news_id').notNull().references(() => breakingNews.id, { onDelete: 'cascade' }),
  filePath: text('file_path'),
  dropboxPath: text('dropbox_path'),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(now),
})

/** FAQ (tanya-jawab publik, jawaban rich-text HTML). */
export const faqs = sqliteTable('faqs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  answer: text('answer').notNull().default(''),
  category: text('category').notNull().default('Umum'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: integer('is_published').notNull().default(1),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(now),
  updatedAt: text('updated_at').notNull().$defaultFn(now),
})

/** SOP Pelayanan Dapodik (gambar, diunggah ke Dropbox folder `sop`). */
export const sops = sqliteTable('sops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  judul: text('judul').notNull(),
  deskripsi: text('deskripsi').notNull().default(''),
  /** URL publik gambar: path relatif lokal (uploads/...) atau URL Dropbox. */
  filePath: text('file_path'),
  /** Path internal Dropbox untuk hapus (NULL untuk driver lokal). */
  dropboxPath: text('dropbox_path'),
  isPublished: integer('is_published').notNull().default(1),
  createdAt: text('created_at').notNull().$defaultFn(now),
  updatedAt: text('updated_at').notNull().$defaultFn(now),
})

/** Log pencarian/klik FAQ untuk "paling ditanya/cari". */
export const faqSearchLogs = sqliteTable('faq_search_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  keyword: text('keyword').notNull(),
  faqId: integer('faq_id'),
  createdAt: text('created_at').notNull().$defaultFn(now),
})

/**
 * Pengaduan / penyampaian kendala Dapodik dari pengunjung.
 * status: 'baru' | 'diproses' | 'selesai'
 */
export const complaints = sqliteTable('complaints', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  kontak: text('kontak').notNull(),
  kategori: text('kategori').notNull().default('Lainnya'),
  isi: text('isi').notNull(),
  sekolah: text('sekolah').notNull().default(''),
  status: text('status').notNull().default('baru'),
  adminNote: text('admin_note'),
  /** URL publik lampiran: path relatif lokal (uploads/...) atau URL Dropbox. */
  filePath: text('file_path'),
  /** Path internal Dropbox untuk hapus (NULL untuk driver lokal). */
  dropboxPath: text('dropbox_path'),
  createdAt: text('created_at').notNull().$defaultFn(now),
  updatedAt: text('updated_at').notNull().$defaultFn(now),
})

/** Hit pengunjung per pageview (hit mentah). */
export const visits = sqliteTable('visits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull(),
  ip: text('ip'),
  visitorId: text('visitor_id'),
  userAgent: text('user_agent'),
  referer: text('referer'),
  country: text('country'),
  createdAt: text('created_at').notNull().$defaultFn(now),
})

/** Agregasi harian untuk chart cepat. */
export const visitDaily = sqliteTable('visit_daily', {
  date: text('date').primaryKey(),
  hits: integer('hits').notNull().default(0),
  uniques: integer('uniques').notNull().default(0),
})
