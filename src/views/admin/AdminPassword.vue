<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/site'

const auth = useAuthStore()
const router = useRouter()
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const saving = ref(false)

async function submit(): Promise<void> {
  error.value = ''
  success.value = ''
  if (newPassword.value.length < 8) {
    error.value = 'Password baru minimal 8 karakter.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Konfirmasi password tidak sama.'
    return
  }
  saving.value = true
  try {
    await api.post('/admin/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    await auth.check()
    success.value = 'Password berhasil diganti.'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => router.push('/admin'), 1200)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal mengganti password.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-md">
    <h1 class="text-2xl font-bold tracking-tight">Ganti Password</h1>
    <p v-if="auth.admin?.mustChangePassword" class="mt-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      Anda masih memakai password awal. Wajib diganti sebelum mengelola konten.
    </p>
    <form class="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium" for="cur">Password lama</label>
        <input id="cur" v-model="currentPassword" type="password" autocomplete="current-password" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="new">Password baru (min. 8 karakter)</label>
        <input id="new" v-model="newPassword" type="password" autocomplete="new-password" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="conf">Konfirmasi password baru</label>
        <input id="conf" v-model="confirmPassword" type="password" autocomplete="new-password" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <p v-if="success" class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{{ success }}</p>
      <button :disabled="saving" type="submit" class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
        {{ saving ? 'Menyimpan…' : 'Ganti password' }}
      </button>
    </form>
  </div>
</template>
