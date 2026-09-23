import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../server/db/schema'
import { admins, breakingNews, breakingNewsImages, contentPages, settings, statistics } from '../server/db/schema'
import { hashPassword } from '../server/utils/password'

const tursoUrl = process.env.NUXT_TURSO_URL?.trim() || process.env.TURSO_URL?.trim()
const tursoToken = process.env.NUXT_TURSO_AUTH_TOKEN?.trim() || process.env.TURSO_AUTH_TOKEN?.trim()

let client
if (tursoUrl) {
  if (!tursoToken) throw new Error('Token Turso wajib diisi saat URL diset.')
  client = createClient({ url: tursoUrl, authToken: tursoToken })
} else {
  client = createClient({ url: 'file:./dev.db' })
}

const db = drizzle(client, { schema })

const ADMIN_NAME = process.env.NUXT_ADMIN_NAME?.trim() || 'Administrator'
const ADMIN_USERNAME = process.env.NUXT_ADMIN_USERNAME?.trim() || 'admin'
const ADMIN_PASSWORD = process.env.NUXT_ADMIN_PASSWORD || 'admin123'

const seedPages = [
  {
    slug: 'syarat-pengajuan-nuptk',
    menuGroup: 'ptk',
    title: 'Syarat Pengajuan NUPTK',
    body: '<p>Lengkapi persyaratan berikut untuk pengajuan NUPTK baru (edit konten ini melalui panel admin):</p><ol><li>FC KTP dan Kartu Keluarga.</li><li>FC Ijazah terakhir yang dilegalisir.</li><li>SK Pengangkatan / SK Penugasan dari dinas.</li><li>SK Pembagian Tugas mengajar.</li><li>Surat pengantar dari kepala satuan pendidikan.</li></ol>',
    sortOrder: 1,
  },
  {
    slug: 'syarat-mutasi-ptk',
    menuGroup: 'ptk',
    title: 'Syarat Mutasi PTK',
    body: '<p>Persyaratan mutasi PTK antar satuan pendidikan (edit konten ini melalui panel admin):</p><ol><li>Surat permohonan mutasi dari PTK bersangkutan.</li><li>Surat persetujuan / surat lepas dari sekolah asal.</li><li>Surat penerimaan dari sekolah tujuan.</li><li>SK mutasi dari dinas (jika ASN).</li></ol>',
    sortOrder: 2,
  },
  {
    slug: 'syarat-penambahan-ptk',
    menuGroup: 'ptk',
    title: 'Syarat Penambahan PTK',
    body: '<p>Persyaratan penambahan PTK baru ke Dapodik (edit konten ini melalui panel admin):</p><ol><li>FC KTP dan Kartu Keluarga.</li><li>FC Ijazah terakhir.</li><li>SK Pengangkatan dari yayasan / dinas.</li><li>Surat tugas dari kepala sekolah.</li></ol>',
    sortOrder: 3,
  },
  {
    slug: 'syarat-mutasi-peserta-didik',
    menuGroup: 'peserta_didik',
    title: 'Syarat Mutasi Peserta Didik',
    body: '<p>Persyaratan mutasi peserta didik (edit konten ini melalui panel admin):</p><ol><li>Surat keterangan pindah dari sekolah asal.</li><li>Rapor terakhir.</li><li>FC Kartu Keluarga.</li><li>Surat penerimaan dari sekolah tujuan.</li></ol>',
    sortOrder: 1,
  },
  {
    slug: 'residu-peserta-didik',
    menuGroup: 'peserta_didik',
    title: 'Residu Peserta Didik',
    body: '<p>Informasi penanganan residu data peserta didik (edit konten ini melalui panel admin):</p><ol><li>Unduh daftar residu dari VervalPD.</li><li>Perbaiki data induk sesuai dokumen kependudukan.</li><li>Unggah dokumen pendukung bila diminta.</li></ol>',
    sortOrder: 2,
  },
  {
    slug: 'syarat-pengajuan-sarpras',
    menuGroup: 'sarana',
    title: 'Syarat Pengajuan Sarana Prasarana',
    body: '<p>Persyaratan pengajuan sarana prasarana baru (edit konten ini melalui panel admin):</p><ol><li>Surat pengajuan dari kepala satuan pendidikan.</li><li>Berita acara / dokumentasi kebutuhan.</li><li>Rencana penggunaan dan penempatan.</li></ol>',
    sortOrder: 1,
  },
  {
    slug: 'syarat-penghapusan-sarpras',
    menuGroup: 'sarana',
    title: 'Syarat Penghapusan Sarana Prasarana',
    body: '<p>Persyaratan penghapusan sarana prasarana (edit konten ini melalui panel admin):</p><ol><li>Surat usulan penghapusan dari kepala satuan pendidikan.</li><li>Berita acara pemeriksaan kondisi barang.</li><li>Dokumentasi / foto barang.</li><li>SK penghapusan dari pejabat berwenang.</li></ol>',
    sortOrder: 2,
  },
]

const seedSettings: Array<[string, string]> = [
  ['site_name', 'SIINDAH — Layanan Dapodik'],
  ['site_tagline', 'Microsite informasi dan pelayanan pendataan Dapodik'],
  ['contact_wa', ''],
  ['footer_text', 'Dinas Pendidikan — Bidang Pendataan Dapodik'],
]

const seedStatistics = [
  { category: 'satuan_pendidikan', jenjang: null, label: 'Jumlah Satuan Pendidikan', value: 0, period: '2026/2027 Ganjil', isCurrent: 1 },
  { category: 'peserta_didik', jenjang: null, label: 'Jumlah Peserta Didik', value: 0, period: '2026/2027 Ganjil', isCurrent: 1 },
  { category: 'guru', jenjang: null, label: 'Jumlah Guru', value: 0, period: '2026/2027 Ganjil', isCurrent: 1 },
  { category: 'tendik', jenjang: null, label: 'Jumlah Tenaga Kependidikan', value: 0, period: '2026/2027 Ganjil', isCurrent: 1 },
]

async function main(): Promise<void> {
  const existingAdmin = await db.query.admins.findFirst()
  if (!existingAdmin) {
    await db.insert(admins).values({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      mustChangePassword: 1,
    })
    console.log(`Admin dibuat: ${ADMIN_USERNAME} (wajib ganti password saat login pertama)`)
  } else {
    console.log(`Admin sudah ada (${existingAdmin.username}) — dilewati`)
  }

  for (const [key, value] of seedSettings) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing()
  }
  console.log('Settings di-seed')

  if ((await db.query.contentPages.findMany()).length === 0) {
    await db.insert(contentPages).values(seedPages.map((p) => ({ ...p, isPublished: 1 })))
    console.log(`${seedPages.length} halaman konten di-seed`)
  } else {
    console.log('Halaman konten sudah ada — dilewati')
  }

  if ((await db.query.statistics.findMany()).length === 0) {
    await db.insert(statistics).values(seedStatistics)
    console.log(`${seedStatistics.length} baris statistik awal di-seed (nilai 0, silakan isi via panel admin)`)
  } else {
    console.log('Statistik sudah ada — dilewati')
  }

  if ((await db.query.breakingNews.findMany()).length === 0) {
    const [news] = await db
      .insert(breakingNews)
      .values({
        title: 'Selamat datang di microsite layanan Dapodik',
        body: 'Informasi, syarat layanan, statistik, dan pengaduan kini terpusat di satu tempat.',
        isActive: 1,
      })
      .returning()
    await db.insert(breakingNewsImages).values({
      newsId: news.id,
      filePath: null,
      dropboxPath: null,
      description: 'Dokumentasi layanan Dapodik',
      sortOrder: 0,
    })
    console.log('Breaking news sambutan di-seed')
  } else {
    console.log('Breaking news sudah ada — dilewati')
  }

  process.exit(0)
}

await main()
