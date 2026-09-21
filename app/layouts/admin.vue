<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAuthStore } from '~/stores/site'

const auth = useAuthStore()
const route = useRoute()

const links = computed<NavigationMenuItem[]>(() => [
  { label: 'Dashboard', to: '/admin', exact: true },
  { label: 'Statistik', to: '/admin/statistik' },
  { label: 'Halaman Syarat', to: '/admin/halaman' },
  { label: 'Surat Informasi', to: '/admin/surat' },
  { label: 'Link Informasi', to: '/admin/link' },
  { label: 'Breaking News', to: '/admin/berita' },
  { label: 'Pengaduan', to: '/admin/pengaduan' },
  { label: 'Pengaturan', to: '/admin/pengaturan' },
  { label: 'Ganti Password', to: '/admin/password' },
])

const mustChange = computed(() => auth.admin?.mustChangePassword === true)

async function logout(): Promise<void> {
  await auth.logout()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-muted text-default">
    <aside class="hidden w-60 shrink-0 flex-col bg-inverted p-4 text-inverted md:flex">
      <p class="px-2 py-3 font-bold">SIINDAH Admin</p>
      <p class="px-2 pb-3 text-xs opacity-70">{{ auth.admin?.name }} ({{ auth.admin?.username }})</p>
      <UNavigationMenu :items="links" orientation="vertical" variant="link" class="flex-1" />
      <UButton to="/" variant="ghost" color="neutral" class="justify-start">
        ← Lihat situs
      </UButton>
      <UButton variant="ghost" color="error" class="justify-start" @click="logout">
        Keluar
      </UButton>
    </aside>

    <div class="min-w-0 flex-1">
      <div class="sticky top-0 z-10 border-b border-default bg-default px-4 py-3">
        <p class="font-semibold md:hidden">SIINDAH Admin</p>
        <UNavigationMenu :items="links" variant="pill" class="hidden overflow-x-auto md:flex" />
        <div class="mt-2 flex md:hidden">
          <UButton size="sm" variant="outline" color="error" @click="logout">Keluar</UButton>
        </div>
        <UNavigationMenu :items="links" orientation="vertical" class="mt-2 md:hidden" />
      </div>

      <UAlert
        v-if="mustChange && route.path !== '/admin/password'"
        color="warning"
        variant="soft"
        title="Anda login dengan password awal."
        description="Ganti password sekarang sebelum mengelola konten."
        :actions="[{ label: 'Ganti password', to: '/admin/password' }]"
        class="m-4 mb-0"
      />

      <main class="mx-auto max-w-5xl p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
