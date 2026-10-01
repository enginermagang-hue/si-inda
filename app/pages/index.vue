<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import { STAT_META, type NewsItem, type Statistic } from '~/composables/api'
import { useSiteStore } from '~/stores/site'

const site = useSiteStore()
await site.load()

const heroLinks = ref<ButtonProps[]>([
  {
    label: 'Lihat Statistik',
    to: '/statistik',
    color: 'primary',
    trailingIcon: 'i-lucide-arrow-right',
  },
])

const { data: statsRes } = await useFetch<{ data: Statistic[] }>('/api/statistics', {
  default: () => ({ data: [] as Statistic[] }),
})
const stats = computed(() => (statsRes.value?.data || []) as Statistic[])
const { data: newsRes } = await useFetch<{ data: NewsItem[] }>('/api/breaking-news', {
  default: () => ({ data: [] as NewsItem[] }),
})
const news = computed(() => newsRes.value.data.slice(0, 3))

function statValue(category: Statistic['category']): { value: number; period: string } {
  const list = stats.value.filter((s) => s.category === category && s.jenjang !== null)
  const total = list.reduce((sum, r) => sum + r.value, 0)
  return { value: total, period: list[0]?.period ?? '-' }
}

function formatNum(n: number): string {
  return n.toLocaleString('id-ID')
}

const services = [
  { to: '/informasi/surat', icon: 'i-lucide-file-text', title: 'Surat Informasi Dapodik', desc: 'Kumpulan surat edaran dan pemberitahuan resmi.' },
  { to: '/ptk/syarat-pengajuan-nuptk', icon: 'i-lucide-users', title: 'Layanan PTK', desc: 'Syarat NUPTK, mutasi, dan penambahan PTK.' },
  { to: '/peserta-didik/syarat-mutasi-peserta-didik', icon: 'i-lucide-backpack', title: 'Layanan Peserta Didik', desc: 'Syarat mutasi dan penanganan residu.' },
  { to: '/peserta-didik/residu-peserta-didik', icon: 'i-lucide-backpack', title: 'Residu Peserta Didik', desc: 'Penanganan Residu Peserta Didik.' },
  { to: '/sarana/syarat-pengajuan-sarpras', icon: 'i-lucide-school', title: 'Sarana Prasarana', desc: 'Pengajuan dan penghapusan sarpras.' },
  { to: '/informasi/link', icon: 'i-lucide-link', title: 'Link Informasi', desc: 'Tautan penting seputar Dapodik.' },
]
</script>

<template>
  <div>
    <UPageHero
      :title="site.settings.site_name"
      :description="site.settings.site_tagline"
      headline="Terintegrasi Dapodik"
      orientation="horizontal"
      :links="heroLinks"
    >
      <img
        src="/hero.jpg"
        alt="Ilustrasi pendataan Dapodik"
        width="2048"
        height="1152"
        sizes="(min-width: 1024px) 50vw, 100vw"
        class="rounded-lg shadow-2xl ring ring-default w-full object-contain aspect-[16/9]"
        loading="eager"
        decoding="async"
        fetchpriority="high"
      >
    </UPageHero>

    <UPageSection title="Statistik Dapodik">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UPageCard
          v-for="(meta, key) in STAT_META"
          :key="key"
          :title="meta.title"
          to="/statistik"
          variant="outline"
        >
          <p class="text-3xl font-bold tracking-tight text-primary">
            {{ formatNum(statValue(key).value) }}
          </p>
          <p class="mt-1 text-xs text-muted">Periode {{ statValue(key).period }}</p>
        </UPageCard>
      </div>
    </UPageSection>

    <UPageSection title="Layanan Informasi">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UPageCard
          v-for="s in services"
          :key="s.to"
          :title="s.title"
          :description="s.desc"
          :icon="s.icon"
          :to="s.to"
          variant="outline"
        />
      </div>
    </UPageSection>

    <UPageSection v-if="news.length" title="Kabar Terbaru">
      <template #links>
        <UButton to="/informasi/berita" variant="link" color="neutral">
          Semua berita <UIcon name="i-lucide-arrow-right" />
        </UButton>
      </template>
      <div class="grid gap-4 md:grid-cols-3">
        <BreakingNewsCard
          v-for="(item, i) in news"
          :key="item.id"
          :item="item"
          :lazy="i > 0"
        />
      </div>
    </UPageSection>
  </div>
</template>
