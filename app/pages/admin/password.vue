<script setup lang="ts">
import { api } from '~/composables/api'
import { useAuthStore } from '~/stores/site'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const auth = useAuthStore()
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
    setTimeout(() => navigateTo('/admin'), 1200)
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
    <UAlert
      v-if="auth.admin?.mustChangePassword"
      color="warning"
      variant="soft"
      title="Anda masih memakai password awal. Wajib diganti sebelum mengelola konten."
      class="mt-2"
    />
    <UCard class="mt-4">
      <UForm :state="{ currentPassword, newPassword, confirmPassword }" class="space-y-4" @submit="submit">
        <UFormField label="Password lama" name="cur" required>
          <UInput v-model="currentPassword" type="password" autocomplete="current-password" class="w-full" />
        </UFormField>
        <UFormField label="Password baru (min. 8 karakter)" name="new" required>
          <UInput v-model="newPassword" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>
        <UFormField label="Konfirmasi password baru" name="conf" required>
          <UInput v-model="confirmPassword" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>
        <UAlert v-if="error" color="error" variant="soft" :title="error" />
        <UAlert v-if="success" color="success" variant="soft" :title="success" />
        <UButton type="submit" :loading="saving" block>Ganti password</UButton>
      </UForm>
    </UCard>
  </div>
</template>
