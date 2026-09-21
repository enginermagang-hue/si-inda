<script setup lang="ts">
import { computed } from 'vue'
import { useSiteStore } from '@/stores/site'

const site = useSiteStore()

const waLink = computed(() => {
  const raw = site.settings.contact_wa.replace(/[^0-9]/g, '')
  return raw ? `https://wa.me/${raw}` : ''
})
</script>

<template>
  <footer class="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
    <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
      <div>
        <p class="font-bold text-white">{{ site.settings.site_name }}</p>
        <p class="mt-2 text-sm text-slate-400">{{ site.settings.site_tagline }}</p>
      </div>
      <div>
        <p class="font-semibold text-white">Layanan</p>
        <ul class="mt-2 space-y-1 text-sm">
          <li>Statistik Dapodik</li>
          <li>Pengajuan NUPTK & Mutasi</li>
          <li>Peserta Didik & Sarana Prasarana</li>
          <li>Pengaduan Kendala Dapodik</li>
        </ul>
      </div>
      <div>
        <p class="font-semibold text-white">Kontak</p>
        <p class="mt-2 text-sm text-slate-400">{{ site.settings.footer_text }}</p>
        <a
          v-if="waLink"
          :href="waLink"
          target="_blank"
          rel="noopener"
          class="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Hubungi via WhatsApp
        </a>
      </div>
    </div>
    <div class="border-t border-white/10">
      <div class="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-500">
        {{ site.settings.footer_text }}
      </div>
    </div>
  </footer>
</template>
