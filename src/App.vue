<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import SiteNavbar from './components/SiteNavbar.vue'
import NewsTicker from './components/NewsTicker.vue'
import SiteFooter from './components/SiteFooter.vue'
import { useSiteStore } from '@/stores/site'

const site = useSiteStore()
const route = useRoute()

onMounted(() => site.load())

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <div v-if="isAdminRoute">
    <RouterView />
  </div>
  <div v-else class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <SiteNavbar />
    <NewsTicker />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>
