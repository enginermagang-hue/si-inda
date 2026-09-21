<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api, STAT_META, type NewsItem, type Statistic } from '@/lib/api'
import { useSiteStore } from '@/stores/site'

const site = useSiteStore()
const stats = ref<Statistic[]>([])
const news = ref<NewsItem[]>([])
const loading = ref(true)

onMounted(async () => {
  await site.load()
  try {
    const [s, n] = await Promise.all([
      api.get<{ data: Statistic[] }>('/statistics'),
      api.get<{ data: NewsItem[] }>('/breaking-news'),
    ])
    stats.value = s.data
    news.value = n.data.slice(0, 3)
  } catch {
    // API belum tersedia — tampilkan kerangka kosong
  } finally {
    loading.value = false
  }
})

function statValue(category: Statistic['category']): { value: number; period: string } {
  const rows = stats.value.filter((s) => s.category === category)
  const total = rows.reduce((sum, r) => sum + r.value, 0)
  return { value: total, period: rows[0]?.period ?? '-' }
}

function formatNum(n: number): string {
  return n.toLocaleString('id-ID')
}
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 py-12 text-white sm:px-12">
      <h1 class="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
        {{ site.settings.site_name }}
      </h1>
      <p class="mt-3 max-w-xl text-emerald-50">{{ site.settings.site_tagline }}</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <RouterLink
          to="/pengaduan"
          class="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Sampaikan Kendala Dapodik
        </RouterLink>
        <RouterLink
          to="/statistik/satuan-pendidikan"
          class="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Lihat Statistik
        </RouterLink>
      </div>
    </section>

    <!-- Statistik ringkas -->
    <section class="mt-8">
      <h2 class="text-xl font-bold tracking-tight">Statistik Dapodik</h2>
      <p v-if="loading" class="mt-4 text-sm text-slate-500">Memuat data…</p>
      <div v-else class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RouterLink
          v-for="(meta, key) in STAT_META"
          :key="key"
          :to="meta.route"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p class="text-sm font-medium text-slate-500">{{ meta.title }}</p>
          <p class="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
            {{ formatNum(statValue(key).value) }}
          </p>
          <p class="mt-1 text-xs text-slate-400">Periode {{ statValue(key).period }}</p>
        </RouterLink>
      </div>
    </section>

    <!-- Menu layanan -->
    <section class="mt-10">
      <h2 class="text-xl font-bold tracking-tight">Layanan Informasi</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink to="/informasi/surat" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p class="font-semibold">📄 Surat Informasi Dapodik</p>
          <p class="mt-1 text-sm text-slate-500">Kumpulan surat edaran dan pemberitahuan resmi.</p>
        </RouterLink>
        <RouterLink to="/ptk/syarat-pengajuan-nuptk" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p class="font-semibold">👩‍🏫 Layanan PTK</p>
          <p class="mt-1 text-sm text-slate-500">Syarat NUPTK, mutasi, dan penambahan PTK.</p>
        </RouterLink>
        <RouterLink to="/peserta-didik/syarat-mutasi-peserta-didik" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p class="font-semibold">🎒 Layanan Peserta Didik</p>
          <p class="mt-1 text-sm text-slate-500">Syarat mutasi dan penanganan residu.</p>
        </RouterLink>
        <RouterLink to="/sarana/syarat-pengajuan-sarpras" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p class="font-semibold">🏫 Sarana Prasarana</p>
          <p class="mt-1 text-sm text-slate-500">Pengajuan dan penghapusan sarpras.</p>
        </RouterLink>
        <RouterLink to="/informasi/link" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p class="font-semibold">🔗 Link Informasi</p>
          <p class="mt-1 text-sm text-slate-500">Tautan penting seputar Dapodik.</p>
        </RouterLink>
        <RouterLink to="/pengaduan" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p class="font-semibold">📢 Pengaduan</p>
          <p class="mt-1 text-sm text-slate-500">Sampaikan kendala pendataan Dapodik.</p>
        </RouterLink>
      </div>
    </section>

    <!-- Berita terbaru -->
    <section v-if="news.length" class="mt-10">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold tracking-tight">Kabar Terbaru</h2>
        <RouterLink to="/informasi/berita" class="text-sm font-medium text-emerald-700 hover:underline">
          Semua berita →
        </RouterLink>
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <article v-for="item in news" :key="item.id" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-xs text-slate-400">{{ new Date(item.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
          <h3 class="mt-1 font-semibold">{{ item.title }}</h3>
          <p v-if="item.body" class="mt-1 line-clamp-2 text-sm text-slate-500">{{ item.body }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
