<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import { useSiteStore } from '@/stores/site'

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
    <p class="mt-1 text-sm text-slate-500">Nama situs, link SOP Google Drive, kontak, dan teks footer.</p>

    <p v-if="loading" class="mt-4 text-sm text-slate-500">Memuat…</p>
    <div v-else class="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label class="mb-1 block text-sm font-medium">Nama situs</label>
        <input v-model="form.site_name" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Tagline</label>
        <input v-model="form.site_tagline" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div class="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <label class="mb-1 block text-sm font-medium" for="sop">Link SOP Pelayanan Dapodik (Google Drive)</label>
        <input
          id="sop"
          v-model="form.sop_drive_url"
          type="url"
          placeholder="https://drive.google.com/drive/folders/…"
          class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <p class="mt-1 text-xs text-slate-500">
          Tempel link folder/file Drive (pastikan sharing "Anyone with the link"). Menu SOP di situs membuka link ini di tab baru. Kosongkan untuk menonaktifkan menu.
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Kontak WhatsApp (angka saja, mis. 62812…)</label>
        <input v-model="form.contact_wa" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Teks footer</label>
        <input v-model="form.footer_text" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <p v-if="success" class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{{ success }}</p>
      <button :disabled="saving" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50" @click="save">
        {{ saving ? 'Menyimpan…' : 'Simpan pengaturan' }}
      </button>
    </div>
  </div>
</template>
