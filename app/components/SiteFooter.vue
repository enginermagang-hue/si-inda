<script setup lang="ts">
import { useSiteStore } from '~/stores/site'

const site = useSiteStore()
await site.load()

const waLink = computed(() => {
  const raw = site.settings.contact_wa.replace(/[^0-9]/g, '')
  return raw ? `https://wa.me/${raw}` : ''
})
</script>

<template>
  <UFooter>
    <template #top>
      <div class="grid gap-8 md:grid-cols-3">
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
            class="mt-3"
          >
            Hubungi via WhatsApp
          </UButton>
        </div>
      </div>
    </template>
    <template #bottom>
      <p class="text-center text-xs text-muted">{{ site.settings.footer_text }}</p>
    </template>
  </UFooter>
</template>
