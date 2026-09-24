<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useSiteStore } from '~/stores/site'

const site = useSiteStore()
await site.load()

const waLink = computed(() => {
  const raw = site.settings.contact_wa.replace(/[^0-9]/g, '')
  return raw ? `https://wa.me/${raw}` : ''
})

const bottomNav: NavigationMenuItem[] = [
  { label: 'Beranda', to: '/' },
  { label: 'Statistik', to: '/statistik' },
  { label: 'Layanan PTK', to: '/ptk/syarat-pengajuan-nuptk' },
  { label: 'Pengaduan', to: '/pengaduan' },
  { label: 'FAQ', to: '/faq' },
]

const layananLinks: Array<{ label: string; to: string }> = [
  { label: 'Statistik Dapodik', to: '/statistik' },
  { label: 'Pengajuan NUPTK & Mutasi', to: '/ptk/syarat-pengajuan-nuptk' },
  { label: 'Peserta Didik & Sarana', to: '/peserta-didik/syarat-mutasi-peserta-didik' },
  { label: 'Pengaduan Kendala Dapodik', to: '/pengaduan' },
]
</script>

<template>
  <UFooter
    :ui="{
      top: 'border-t border-default py-8 lg:py-10',
      container: 'py-6 lg:py-4 lg:gap-x-6 gap-y-4 flex flex-col lg:flex-row lg:items-center lg:justify-between',
      left: 'flex justify-center lg:justify-start lg:flex-1 order-3 lg:order-1',
      center: 'flex justify-center order-1 lg:order-2',
      right: 'flex justify-center lg:justify-end lg:flex-1 order-2 lg:order-3',
    }"
  >
    <template #top>
      <div class="w-full px-4 sm:px-6 lg:px-8 max-w-(--ui-container) mx-auto grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 class="text-sm font-bold tracking-tight">{{ site.settings.site_name }}</h3>
          <p class="mt-2 max-w-prose text-sm leading-relaxed text-muted">{{ site.settings.site_tagline }}</p>
        </div>
        <div>
          <h3 id="footer-layanan" class="text-sm font-semibold">Layanan</h3>
          <ul class="mt-3 space-y-2 text-sm" aria-labelledby="footer-layanan">
            <li v-for="l in layananLinks" :key="l.to">
              <ULink :to="l.to" class="text-muted hover:text-highlighted transition-colors">
                {{ l.label }}
              </ULink>
            </li>
          </ul>
        </div>
        <div>
          <h3 id="footer-kontak" class="text-sm font-semibold mb-3">Pengunjung</h3>
          <VisitorWidget />
        </div>
      </div>
    </template>

    <template #left>
      <div class="flex w-full flex-col items-center gap-2 lg:items-start text-center lg:text-left">
        <p class="text-xs sm:text-sm text-muted">
          Copyright © {{ new Date().getFullYear() }} {{ site.settings.site_name }}
        </p>
      </div>
    </template>

    <nav aria-label="Navigasi footer">
      <UNavigationMenu :items="bottomNav" variant="link" :ui="{ list: 'flex  flex-wrap justify-center gap-x-1 gap-y-1' }" />
    </nav>

    <template #right>
      <UButton
        v-if="waLink"
        icon="i-lucide-message-circle"
        color="neutral"
        variant="ghost"
        :to="waLink"
        target="_blank"
        aria-label="WhatsApp"
      />
    </template>
  </UFooter>
</template>
