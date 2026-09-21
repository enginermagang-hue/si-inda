<script setup lang="ts">
import { api, COMPLAINT_CATEGORIES } from '~/composables/api'

const nama = ref('')
const kontak = ref('')
const kategori = ref('Lainnya')
const isi = ref('')
const sending = ref(false)
const error = ref('')
const ticket = ref<number | null>(null)

async function submit(): Promise<void> {
  error.value = ''
  if (!nama.value.trim() || !kontak.value.trim()) {
    error.value = 'Nama dan kontak wajib diisi.'
    return
  }
  if (isi.value.trim().length < 10) {
    error.value = 'Uraian kendala minimal 10 karakter.'
    return
  }
  sending.value = true
  try {
    const res = await api.post<{ message: string; ticket: number }>('/complaints', {
      nama: nama.value.trim(),
      kontak: kontak.value.trim(),
      kategori: kategori.value,
      isi: isi.value.trim(),
    })
    ticket.value = res.ticket
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal mengirim pengaduan.'
  } finally {
    sending.value = false
  }
}

function reset(): void {
  ticket.value = null
  nama.value = ''
  kontak.value = ''
  kategori.value = 'Lainnya'
  isi.value = ''
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <p class="text-sm text-muted">Pengaduan</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Penyampaian Kendala Dapodik</h1>
    <p class="mt-1 text-sm text-muted">
      Sampaikan kendala pendataan Anda. Tidak perlu akun — cukup isi formulir, catat nomor tiketnya.
    </p>

    <UCard v-if="ticket !== null" class="mt-6 text-center" variant="soft">
      <p class="text-lg font-bold text-primary">Pengaduan terkirim!</p>
      <p class="mt-1 text-sm">Nomor tiket Anda:</p>
      <p class="mt-1 text-4xl font-bold tracking-tight text-primary">#{{ ticket }}</p>
      <p class="mt-2 text-xs text-muted">Simpan nomor ini untuk menanyakan status ke admin.</p>
      <UButton class="mt-4" @click="reset">Buat pengaduan lain</UButton>
    </UCard>

    <UForm v-else :state="{ nama, kontak, kategori, isi }" class="mt-6 space-y-4" @submit="submit">
      <UFormField label="Nama lengkap" name="nama" required>
        <UInput v-model="nama" placeholder="Nama Anda" maxlength="100" class="w-full" />
      </UFormField>
      <UFormField label="Kontak (No. WA / email)" name="kontak" required>
        <UInput v-model="kontak" placeholder="08xx atau email" maxlength="100" class="w-full" />
      </UFormField>
      <UFormField label="Kategori kendala" name="kategori">
        <USelect v-model="kategori" :items="COMPLAINT_CATEGORIES" class="w-full" />
      </UFormField>
      <UFormField label="Uraian kendala" name="isi" required help="Minimal 10 karakter.">
        <UTextarea
          v-model="isi"
          :rows="5"
          maxlength="2000"
          placeholder="Jelaskan kendala selengkap mungkin…"
          class="w-full"
        />
      </UFormField>
      <UAlert v-if="error" color="error" variant="soft" :title="error" />
      <UButton type="submit" :loading="sending" block>Kirim Pengaduan</UButton>
    </UForm>
  </div>
</template>
