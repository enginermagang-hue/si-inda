<script setup lang="ts">
import { useSiteStore } from '~/stores/site'

const site = useSiteStore()
const route = useRoute()

await site.load()

interface PageLink {
  slug: string
  title: string
}

const { data: ptkRes } = await useFetch<{ data: PageLink[] }>('/api/pages', {
  query: { group: 'ptk' },
  default: () => ({ data: [] as PageLink[] }),
})
const { data: pdRes } = await useFetch<{ data: PageLink[] }>('/api/pages', {
  query: { group: 'peserta_didik' },
  default: () => ({ data: [] as PageLink[] }),
})
const { data: saranaRes } = await useFetch<{ data: PageLink[] }>('/api/pages', {
  query: { group: 'sarana' },
  default: () => ({ data: [] as PageLink[] }),
})
const ptkPages = computed(() => ptkRes.value.data)
const pdPages = computed(() => pdRes.value.data)
const saranaPages = computed(() => saranaRes.value.data)

const fallbackPtk = [
  { slug: 'syarat-pengajuan-nuptk', title: 'Syarat Pengajuan NUPTK' },
  { slug: 'syarat-mutasi-ptk', title: 'Syarat Mutasi PTK' },
  { slug: 'syarat-penambahan-ptk', title: 'Syarat Penambahan PTK' },
]
const fallbackPd = [
  { slug: 'syarat-mutasi-peserta-didik', title: 'Syarat Mutasi Peserta Didik' },
  { slug: 'residu-peserta-didik', title: 'Residu Peserta Didik' },
]
const fallbackSarana = [
  { slug: 'syarat-pengajuan-sarpras', title: 'Syarat Pengajuan Sarana Prasarana' },
  { slug: 'syarat-penghapusan-sarpras', title: 'Syarat Penghapusan Sarana Prasarana' },
]

const items = computed(() => [
  {
    label: 'Statistik Dapodik',
    children: [
      { label: 'Jumlah Satuan Pendidikan', to: '/statistik/satuan-pendidikan' },
      { label: 'Jumlah Peserta Didik', to: '/statistik/peserta-didik' },
      { label: 'Jumlah Guru', to: '/statistik/guru' },
      { label: 'Jumlah Tendik', to: '/statistik/tendik' },
    ],
  },
  {
    label: 'Informasi',
    children: [
      { label: 'Surat Informasi Dapodik', to: '/informasi/surat' },
      { label: 'Link Informasi Dapodik', to: '/informasi/link' },
      { label: 'Breaking News', to: '/informasi/berita' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    label: 'PTK',
    children: (ptkPages.value.length ? ptkPages.value : fallbackPtk).map((p) => ({
      label: p.title,
      to: `/ptk/${p.slug}`,
    })),
  },
  {
    label: 'Peserta Didik',
    children: (pdPages.value.length ? pdPages.value : fallbackPd).map((p) => ({
      label: p.title,
      to: `/peserta-didik/${p.slug}`,
    })),
  },
  {
    label: 'Sarana Prasarana',
    children: (saranaPages.value.length ? saranaPages.value : fallbackSarana).map((p) => ({
      label: p.title,
      to: `/sarana/${p.slug}`,
    })),
  },
  {
    label: 'SOP Pelayanan Dapodik',
    to: '/sop',
    active: route.path.startsWith('/sop'),
  },
  {
    label: 'Pengaduan',
    to: '/pengaduan',
    active: route.path.startsWith('/pengaduan'),
  },
])
</script>

<template>
  <UHeader :title="site.settings.site_name">
    <template #title>
      <img src="/logo-nav.png" alt="Logo" class="h-6 w-auto">
    </template>

    <UNavigationMenu arrow content-orientation="vertical" :items="items" class="w-full justify-center" :ui="{ content: 'w-auto min-w-60', childLinkLabel: 'whitespace-normal break-words' }" />

    <template #right>
      <UColorModeButton />
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
