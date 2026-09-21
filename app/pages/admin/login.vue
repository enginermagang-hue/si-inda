<script setup lang="ts">
import { useAuthStore } from '~/stores/site'

definePageMeta({ layout: false })

const auth = useAuthStore()
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
    await navigateTo(me.mustChangePassword ? '/admin/password' : '/admin')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login gagal.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted px-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-bold tracking-tight">Login Admin</h1>
        <p class="mt-1 text-sm text-muted">Microsite layanan Dapodik</p>
      </template>
      <UForm :state="{ username, password }" class="space-y-4" @submit="submit">
        <UFormField label="Username" name="username" required>
          <UInput v-model="username" autocomplete="username" class="w-full" />
        </UFormField>
        <UFormField label="Password" name="password" required>
          <UInput v-model="password" type="password" autocomplete="current-password" class="w-full" />
        </UFormField>
        <UAlert v-if="error" color="error" variant="soft" :title="error" />
        <UButton type="submit" :loading="loading" block>Masuk</UButton>
        <UButton to="/" variant="link" color="neutral" block>← Kembali ke situs</UButton>
      </UForm>
    </UCard>
  </div>
</template>
