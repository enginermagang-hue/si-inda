<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/site'

const auth = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit(): Promise<void> {
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = 'Username dan password wajib diisi.'
    return
  }
  loading.value = true
  try {
    const me = await auth.login(username.value.trim(), password.value)
    await router.push(me.mustChangePassword ? '/admin/password' : '/admin')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login gagal.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4">
    <form class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm" @submit.prevent="submit">
      <h1 class="text-xl font-bold tracking-tight">Login Admin</h1>
      <p class="mt-1 text-sm text-slate-500">Microsite layanan Dapodik</p>
      <div class="mt-6 space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium" for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {{ loading ? 'Memeriksa…' : 'Masuk' }}
        </button>
        <RouterLink to="/" class="block text-center text-sm text-slate-500 hover:underline">
          ← Kembali ke situs
        </RouterLink>
      </div>
    </form>
  </div>
</template>
