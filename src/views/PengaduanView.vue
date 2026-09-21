<script setup lang="ts">
import { ref } from 'vue'
import { api, COMPLAINT_CATEGORIES } from '@/lib/api'

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
    <p class="text-sm text-slate-500">Pengaduan</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Penyampaian Kendala Dapodik</h1>
    <p class="mt-1 text-sm text-slate-500">
      Sampaikan kendala pendataan Anda. Tidak perlu akun — cukup isi formulir, catat nomor tiketnya.
    </p>

    <div v-if="ticket !== null" class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
      <p class="text-lg font-bold text-emerald-800">Pengaduan terkirim!</p>
      <p class="mt-1 text-sm text-emerald-700">Nomor tiket Anda:</p>
      <p class="mt-1 text-4xl font-bold tracking-tight text-emerald-700">#{{ ticket }}</p>
      <p class="mt-2 text-xs text-emerald-600">Simpan nomor ini untuk menanyakan status ke admin.</p>
      <button
        class="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        @click="reset"
      >
        Buat pengaduan lain
      </button>
    </div>

    <form v-else class="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium" for="nama">Nama lengkap</label>
        <input
          id="nama"
          v-model="nama"
          type="text"
          maxlength="100"
          placeholder="Nama Anda"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="kontak">Kontak (No. WA / email)</label>
        <input
          id="kontak"
          v-model="kontak"
          type="text"
          maxlength="100"
          placeholder="08xx atau email"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="kategori">Kategori kendala</label>
        <select
          id="kategori"
          v-model="kategori"
          class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option v-for="c in COMPLAINT_CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="isi">Uraian kendala</label>
        <textarea
          id="isi"
          v-model="isi"
          rows="5"
          maxlength="2000"
          placeholder="Jelaskan kendala selengkap mungkin (minimal 10 karakter)…"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        ></textarea>
      </div>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <button
        type="submit"
        :disabled="sending"
        class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {{ sending ? 'Mengirim…' : 'Kirim Pengaduan' }}
      </button>
    </form>
  </div>
</template>
