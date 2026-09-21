<script setup lang="ts">
import { api } from '~/composables/api'
import { useSiteStore } from '~/stores/site'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const site = useSiteStore()
const form = ref({ site_name: '', site_tagline: '', sop_drive_url: '', contact_wa: '', footer_text: '' })
const loading = ref(true)
const error = ref('')
const success = ref('')
const saving = ref(false)

async function load(): Promise<void> {
  loading.value = true
  try {
    const res = await api.get<{ data: Array<{ key: string; value: string }> }>('/admin/settings')
    for (const row of res.data) {
      if (row.key in form.value) form.value[row.key as keyof typeof form.value] = row.value
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal memuat.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function save(): Promise<void> {
  error.value = ''
  success.value = ''
  if (form.value.sop_drive_url.trim() && !/^https?:\/\//i.test(form.value.sop_drive_url.trim())) {
    error.value = 'Link SOP Google Drive harus diawali http(s):// atau dikosongkan.'
    return
  }
  saving.value = true
  try {
    await api.put('/admin/settings', {
      site_name: form.value.site_name,
      site_tagline: form.value.site_tagline,
      sop_drive_url: form.value.sop_drive_url.trim(),
      contact_wa: form.value.contact_wa,
      footer_text: form.value.footer_text,
    })
    site.refresh()
    await site.load()
    success.value = 'Pengaturan tersimpan dan langsung tampil di situs.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold tracking-tight">Pengaturan Situs</h1>
    <p class="mt-1 text-sm text-muted">Nama situs, link SOP Google Drive, kontak, dan teks footer.</p>

    <p v-if="loading" class="mt-4 text-sm text-muted">Memuat…</p>
    <UCard v-else class="mt-4">
      <div class="space-y-4">
        <UFormField label="Nama situs">
          <UInput v-model="form.site_name" class="w-full" />
        </UFormField>
        <UFormField label="Tagline">
          <UInput v-model="form.site_tagline" class="w-full" />
        </UFormField>
        <UCard variant="soft">
          <UFormField label="Link SOP Pelayanan Dapodik (Google Drive)">
            <UInput v-model="form.sop_drive_url" type="url" placeholder="https://drive.google.com/drive/folders/…" class="w-full" />
          </UFormField>
          <p class="mt-1 text-xs text-muted">
            Tempel link folder/file Drive (sharing "Anyone with the link"). Menu SOP membuka link ini di tab baru. Kosongkan untuk menonaktifkan menu.
          </p>
        </UCard>
        <UFormField label="Kontak WhatsApp (angka saja, mis. 62812…)">
          <UInput v-model="form.contact_wa" class="w-full" />
        </UFormField>
        <UFormField label="Teks footer">
          <UInput v-model="form.footer_text" class="w-full" />
        </UFormField>
        <UAlert v-if="error" color="error" variant="soft" :title="error" />
        <UAlert v-if="success" color="success" variant="soft" :title="success" />
        <UButton :loading="saving" @click="save">Simpan pengaturan</UButton>
      </div>
    </UCard>
  </div>
</template>
