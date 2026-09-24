<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useSiteStore } from '~/stores/site'

const site = useSiteStore()
await site.load()

const waLink = computed(() => {
  const raw = site.settings.contact_wa.replace(/[^0-9]/g, '')
  return raw ? `https://wa.me/${raw}` : ''
})

const items: NavigationMenuItem[] = [
  { label: 'Beranda', to: '/' },
  { label: 'Statistik Dapodik', to: '/statistik' },
  { label: 'Layanan PTK', to: '/ptk/syarat-pengajuan-nuptk' },
  { label: 'Pengaduan', to: '/pengaduan' },
  { label: 'FAQ', to: '/faq' },
]
</script>

<template>
  <UFooter
    :ui="{
      top: 'py-6 px-6 sm:py-8 lg:py-12',
      container: 'py-6 px-6 flex flex-col gap-4 lg:gap-x-3 lg:py-4 lg:flex-row lg:items-center lg:justify-between',
      left: 'flex justify-center lg:justify-start lg:flex-3 order-3 lg:order-1 mt-0',
      center: 'flex justify-center order-1 lg:order-2 w-full',
      right: 'flex justify-center lg:justify-end lg:flex-1 order-2 lg:order-3'
    }"
  >
    <template #top>
      <div class="mx-auto w-full max-w-6xl">
        <div class="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="font-bold">{{ site.settings.site_name }}</p>
            <p class="mt-2 text-sm text-muted">{{ site.settings.site_tagline }}</p>
          </div>
          <div>
            <p class="font-semibold">Layanan</p>
            <ul class="mt-2 space-y-1 text-sm text-muted">
              <li>Statistik Dapodik</li>
              <li>Pengajuan NUPTK &amp; Mutasi</li>
              <li>Peserta Didik &amp; Sarana Prasarana</li>
              <li>Pengaduan Kendala Dapodik</li>
            </ul>
          </div>
          <div>
            <p class="font-semibold">Kontak</p>
            <p class="mt-2 text-sm text-muted">{{ site.settings.footer_text }}</p>
            <UButton
              v-if="waLink"
              :to="waLink"
              target="_blank"
              color="primary"
              size="md"
              class="mt-3 w-full sm:w-auto justify-center"
            >
              Hubungi via WhatsApp
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <template #left>
      <p class="text-sm text-muted text-center lg:text-left">
        Copyright © {{ new Date().getFullYear() }}
      </p>
    </template>

    <UNavigationMenu :items="items" variant="link" :ui="{ list: 'flex flex-wrap justify-center gap-x-1 gap-y-1 sm:gap-x-2' }" class="w-full justify-center" />

    <template #right>
      <UTooltip v-if="waLink" text="WhatsApp">
        <UButton
          icon="i-lucide-message-circle"
          color="neutral"
          variant="ghost"
          :to="waLink"
          target="_blank"
          aria-label="WhatsApp"
        />
      </UTooltip>
    </template>
  </UFooter>
</template>
