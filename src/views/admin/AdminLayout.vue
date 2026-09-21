<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/site'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const links = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/statistik', label: 'Statistik' },
  { to: '/admin/halaman', label: 'Halaman Syarat' },
  { to: '/admin/surat', label: 'Surat Informasi' },
  { to: '/admin/link', label: 'Link Informasi' },
  { to: '/admin/berita', label: 'Breaking News' },
  { to: '/admin/pengaduan', label: 'Pengaduan' },
  { to: '/admin/pengaturan', label: 'Pengaturan' },
  { to: '/admin/password', label: 'Ganti Password' },
]

const mustChange = computed(() => auth.admin?.mustChangePassword === true)

async function logout(): Promise<void> {
  await auth.logout()
  await router.push('/admin/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-100 text-slate-900">
    <aside class="hidden w-60 shrink-0 flex-col bg-slate-900 text-slate-300 md:flex">
      <div class="px-5 py-5">
        <p class="font-bold text-white">SIINDAH Admin</p>
        <p class="mt-0.5 text-xs text-slate-400">{{ auth.admin?.name }} ({{ auth.admin?.username }})</p>
      </div>
      <nav class="flex-1 space-y-1 px-3">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          :class="[
            'block rounded-lg px-3 py-2 text-sm transition hover:bg-white/10',
            (l.exact ? route.path === l.to : route.path.startsWith(l.to)) ? 'bg-emerald-600 text-white' : '',
          ]"
        >
          {{ l.label }}
        </RouterLink>
      </nav>
      <div class="p-3">
        <RouterLink to="/" class="block rounded-lg px-3 py-2 text-sm transition hover:bg-white/10">
          ← Lihat situs
        </RouterLink>
        <button class="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/10" @click="logout">
          Keluar
        </button>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <div class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <p class="font-semibold md:hidden">SIINDAH Admin</p>
        <div class="hidden gap-1 overflow-x-auto md:flex">
          <RouterLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            :class="[
              'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition hover:bg-slate-100',
              (l.exact ? route.path === l.to : route.path.startsWith(l.to)) ? 'bg-emerald-100 font-medium text-emerald-800' : 'text-slate-600',
            ]"
          >
            {{ l.label }}
          </RouterLink>
        </div>
        <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm md:hidden" @click="logout">Keluar</button>
      </div>

      <div v-if="mustChange && route.path !== '/admin/password'" class="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Anda login dengan password awal. <RouterLink to="/admin/password" class="font-semibold underline">Ganti password sekarang</RouterLink> sebelum mengelola konten.
      </div>

      <main class="mx-auto max-w-5xl p-4 sm:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
