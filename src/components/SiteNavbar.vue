<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/lib/api'
import { useSiteStore } from '@/stores/site'

interface SubItem {
  label: string
  to?: string
  href?: string
  disabled?: boolean
}

interface Menu {
  label: string
  children: SubItem[]
}

const site = useSiteStore()
const route = useRoute()
const mobileOpen = ref(false)
const openMenu = ref<string | null>(null)

const ptkPages = ref<Array<{ slug: string; title: string }>>([])
const pdPages = ref<Array<{ slug: string; title: string }>>([])
const saranaPages = ref<Array<{ slug: string; title: string }>>([])

onMounted(async () => {
  await site.load()
  try {
    const [ptk, pd, sarana] = await Promise.all([
      api.get<{ data: Array<{ slug: string; title: string }> }>('/pages?group=ptk'),
      api.get<{ data: Array<{ slug: string; title: string }> }>('/pages?group=peserta_didik'),
      api.get<{ data: Array<{ slug: string; title: string }> }>('/pages?group=sarana'),
    ])
    ptkPages.value = ptk.data
    pdPages.value = pd.data
    saranaPages.value = sarana.data
  } catch {
    // fallback statis bila API belum tersedia
    ptkPages.value = [
      { slug: 'syarat-pengajuan-nuptk', title: 'Syarat Pengajuan NUPTK' },
      { slug: 'syarat-mutasi-ptk', title: 'Syarat Mutasi PTK' },
      { slug: 'syarat-penambahan-ptk', title: 'Syarat Penambahan PTK' },
    ]
    pdPages.value = [
      { slug: 'syarat-mutasi-peserta-didik', title: 'Syarat Mutasi Peserta Didik' },
      { slug: 'residu-peserta-didik', title: 'Residu Peserta Didik' },
    ]
    saranaPages.value = [
      { slug: 'syarat-pengajuan-sarpras', title: 'Syarat Pengajuan Sarana Prasarana' },
      { slug: 'syarat-penghapusan-sarpras', title: 'Syarat Penghapusan Sarana Prasarana' },
    ]
  }
})

const sopUrl = computed(() => site.settings.sop_drive_url.trim())

const menus = computed<Menu[]>(() => [
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
    ],
  },
  {
    label: 'PTK',
    children: ptkPages.value.map((p) => ({ label: p.title, to: `/ptk/${p.slug}` })),
  },
  {
    label: 'Peserta Didik',
    children: pdPages.value.map((p) => ({ label: p.title, to: `/peserta-didik/${p.slug}` })),
  },
  {
    label: 'Sarana Prasarana',
    children: saranaPages.value.map((p) => ({ label: p.title, to: `/sarana/${p.slug}` })),
  },
  {
    label: 'SOP Pelayanan Dapodik',
    children: sopUrl.value
      ? [{ label: 'SOP Pelayanan Dapodik (Google Drive)', href: sopUrl.value }]
      : [{ label: 'Link SOP belum diatur admin', disabled: true }],
  },
  {
    label: 'Pengaduan',
    children: [{ label: 'Penyampaian Kendala Dapodik', to: '/pengaduan' }],
  },
])

function toggle(label: string): void {
  openMenu.value = openMenu.value === label ? null : label
}

function closeAll(): void {
  openMenu.value = null
  mobileOpen.value = false
}

function isActive(menu: Menu): boolean {
  return menu.children.some((c) => c.to && route.path.startsWith(c.to));
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <RouterLink to="/" class="flex items-center gap-3" @click="closeAll">
        <img src="@/assets/logo.svg" alt="Logo" class="h-10 w-10" />
        <div class="leading-tight">
          <p class="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            {{ site.settings.site_name }}
          </p>
          <p class="hidden text-xs text-slate-500 sm:block">{{ site.settings.site_tagline }}</p>
        </div>
      </RouterLink>

      <!-- Desktop -->
      <nav class="hidden items-center gap-1 lg:flex">
        <div v-for="menu in menus" :key="menu.label" class="relative">
          <button
            class="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-slate-100"
            :class="isActive(menu) ? 'text-emerald-700' : 'text-slate-700'"
            @click="toggle(menu.label)"
            @mouseenter="openMenu = menu.label"
          >
            {{ menu.label }}
          </button>
          <div
            v-if="openMenu === menu.label"
            class="absolute left-0 top-full w-72 pt-1"
            @mouseleave="openMenu = null"
          >
            <div class="overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <template v-for="child in menu.children" :key="child.label">
                <RouterLink
                  v-if="child.to"
                  :to="child.to"
                  class="block px-4 py-2 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                  @click="closeAll"
                >
                  {{ child.label }}
                </RouterLink>
                <a
                  v-else-if="child.href"
                  :href="child.href"
                  target="_blank"
                  rel="noopener"
                  class="block px-4 py-2 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                  @click="closeAll"
                >
                  {{ child.label }} ↗
                </a>
                <span v-else class="block cursor-not-allowed px-4 py-2 text-sm text-slate-400">
                  {{ child.label }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </nav>

      <!-- Mobile toggle -->
      <button
        class="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        aria-label="Buka menu"
        @click="mobileOpen = !mobileOpen"
      >
        <svg v-if="!mobileOpen" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile -->
    <nav v-if="mobileOpen" class="border-t border-slate-200 bg-white px-4 py-2 lg:hidden">
      <div v-for="menu in menus" :key="menu.label" class="border-b border-slate-100 last:border-0">
        <button
          class="flex w-full items-center justify-between py-2.5 text-left text-sm font-semibold text-slate-800"
          @click="toggle(menu.label)"
        >
          {{ menu.label }}
          <span class="text-slate-400">{{ openMenu === menu.label ? '−' : '+' }}</span>
        </button>
        <div v-if="openMenu === menu.label" class="pb-2 pl-3">
          <template v-for="child in menu.children" :key="child.label">
            <RouterLink
              v-if="child.to"
              :to="child.to"
              class="block py-1.5 text-sm text-slate-600"
              @click="closeAll"
            >
              {{ child.label }}
            </RouterLink>
            <a
              v-else-if="child.href"
              :href="child.href"
              target="_blank"
              rel="noopener"
              class="block py-1.5 text-sm text-slate-600"
            >
              {{ child.label }} ↗
            </a>
            <span v-else class="block py-1.5 text-sm text-slate-400">{{ child.label }}</span>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>
