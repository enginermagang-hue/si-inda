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
    label: 'Beranda',
    to: '/',
    active: route.path === '/',
  },
  {
    label: 'Statistik',
    to: '/statistik',
    active: route.path.startsWith('/statistik'),
  },
  {
    label: 'Info Terbaru',
    to: '/informasi/berita',
    active: route.path.startsWith('/informasi/berita'),
  },
  {
    label: 'Informasi',
    children: [
      { label: 'Surat Dapodik', to: '/informasi/surat' },
      { label: 'Link Dapodik', to: '/informasi/link' }
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
    label: 'SOP',
    to: '/sop',
    active: route.path.startsWith('/sop'),
  },
  {
    label: 'FAQ',
    to: '/faq',
    active: route.path.startsWith('/faq')
  }
])
</script>

<template>
  <UHeader
    :title="site.settings.site_name"
    :ui="{
      center: 'hidden min-w-0 justify-center lg:hidden xl:flex',
      toggle: 'lg:flex xl:hidden',
      content: 'lg:block xl:hidden',
      overlay: 'lg:block xl:hidden',
    }"
  >
    <template #title>
      <span class="site-brand-wrap">
        <span class="site-brand">SI-<span class="site-brand-accent">INDAH</span></span>
        <span class="site-subbrand">Sistem Informasi Dapodik</span>
      </span>
    </template>

    <UNavigationMenu arrow content-orientation="vertical" :items="items" class="w-full min-w-0 justify-center" :ui="{ root: 'gap-1', link: 'px-2 text-[13px] gap-1', content: 'w-auto min-w-60', childLinkLabel: 'whitespace-normal break-words' }" />

    <template #right>
      <UColorModeButton />
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>
