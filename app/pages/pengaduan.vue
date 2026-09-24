<script setup lang="ts">
import { api, ApiError, COMPLAINT_CATEGORIES, type ComplaintStatus } from '~/composables/api'

const tab = ref<'buat' | 'lacak'>('buat')
const nama = ref('')
const kontak = ref('')
const sekolah = ref('')
const kategori = ref('Lainnya')
const isi = ref('')
const sending = ref(false)
const error = ref('')
const ticket = ref<number | null>(null)

// --- Lacak status ---
const trackId = ref('')
const tracking = ref(false)
const trackError = ref('')
const trackNotFound = ref(false)
const result = ref<ComplaintStatus | null>(null)

const statusColor = (s: string): 'error' | 'warning' | 'success' =>
  s === 'baru' ? 'error' : s === 'diproses' ? 'warning' : 'success'

const steps = ['baru', 'diproses', 'selesai'] as const

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function track(): Promise<void> {
  trackError.value = ''
  trackNotFound.value = false
  result.value = null
  const id = Number(trackId.value.trim())
  if (!Number.isInteger(id) || id <= 0) {
    trackError.value = 'Masukkan nomor tiket yang valid.'
    return
  }
  tracking.value = true
  try {
    const res = await api.get<{ data: ComplaintStatus }>(`/complaints/${id}`)
    result.value = res.data
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      trackNotFound.value = true
    } else {
      trackError.value = e instanceof Error ? e.message : 'Gagal melacak status.'
    }
  } finally {
    tracking.value = false
  }
}

function trackTicket(id: number): void {
  tab.value = 'lacak'
  trackId.value = String(id)
  void track()
}

async function submit(): Promise<void> {
  error.value = ''
  if (!nama.value.trim() || !kontak.value.trim() || !sekolah.value.trim()) {
    error.value = 'Nama, kontak, dan Nama Sekolah wajib diisi.'
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
      sekolah: sekolah.value.trim(),
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
  sekolah.value = ''
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <p class="text-sm text-muted">Pengaduan</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Penyampaian Kendala Dapodik</h1>
    <p class="mt-1 text-sm text-muted">
      Sampaikan kendala pendataan Anda. Tidak perlu akun — cukup isi formulir, catat nomor tiketnya.
    </p>

    <UTabs
      v-model="tab"
      :items="[
        { value: 'buat', label: 'Buat pengaduan' },
        { value: 'lacak', label: 'Lacak status' },
      ]"
      class="mt-6"
    />

    <div v-if="tab === 'lacak'" class="mt-6 space-y-4">
      <UFormField label="Nomor tiket" name="tiket" help="Nomor yang Anda terima setelah mengirim pengaduan.">
        <div class="flex gap-2">
          <UInput v-model="trackId" placeholder="cth. 12" inputmode="numeric" class="w-full" />
          <UButton :loading="tracking" @click="track">Lacak</UButton>
        </div>
      </UFormField>
      <UAlert v-if="trackError" color="error" variant="soft" :title="trackError" />
      <UEmpty
        v-else-if="trackNotFound"
        icon="i-lucide-search-x"
        :title="`Nomor tiket #${trackId.trim()} tidak ditemukan`"
        description="Pastikan nomor tiket yang Anda masukkan sudah benar."
      />
      <UCard v-if="result" variant="soft">
        <div class="flex items-center justify-between gap-2">
          <p class="font-bold">#{{ result.id }} — {{ result.kategori }}</p>
          <p class="text-xs text-muted">{{ result.sekolah }}</p>
          <UBadge :color="statusColor(result.status)" variant="soft">{{ result.status }}</UBadge>
        </div>
        <ol class="mt-4 space-y-2">
          <li v-for="(s, i) in steps" :key="s" class="flex items-center gap-2 text-sm">
            <span
              class="flex size-6 items-center justify-center rounded-full text-xs font-bold"
              :class="steps.indexOf(result.status) >= i ? 'bg-primary text-white' : 'bg-muted text-muted'"
            >
              {{ i + 1 }}
            </span>
            <span class="capitalize" :class="steps.indexOf(result.status) >= i ? 'font-medium' : 'text-muted'">{{ s }}</span>
          </li>
        </ol>
        <p class="mt-3 text-xs text-muted">Diperbarui: {{ fmt(result.updatedAt) }}</p>
        <div v-if="result.adminNote" class="mt-3 rounded-lg bg-muted p-3">
          <p class="text-xs font-medium uppercase text-muted">Catatan admin</p>
          <p class="mt-1 whitespace-pre-wrap text-sm">{{ result.adminNote }}</p>
        </div>
        <p v-else class="mt-3 text-xs text-muted">Belum ada catatan dari admin.</p>
      </UCard>
    </div>

    <div v-else>
    <UCard v-if="ticket !== null" class="mt-6 text-center" variant="soft">
      <p class="text-lg font-bold text-primary">Pengaduan terkirim!</p>
      <p class="mt-1 text-sm">Nomor tiket Anda:</p>
      <p class="mt-1 text-4xl font-bold tracking-tight text-primary">#{{ ticket }}</p>
      <p class="mt-2 text-xs text-muted">Simpan nomor ini untuk melacak status di tab Lacak status.</p>
      <div class="mt-4 flex justify-center gap-2">
        <UButton variant="outline" @click="trackTicket(ticket)">Lacak status ini</UButton>
        <UButton variant="ghost" @click="reset">Buat pengaduan lain</UButton>
      </div>
    </UCard>

    <UForm v-else :state="{ nama, kontak, sekolah, kategori, isi }" class="mt-6 space-y-4" @submit="submit">
      <UFormField label="Nama lengkap" name="nama" required>
        <UInput v-model="nama" placeholder="Nama Anda" maxlength="100" class="w-full" />
      </UFormField>
      <UFormField label="Kontak (No. WA / email)" name="kontak" required>
        <UInput v-model="kontak" placeholder="08xx atau email" maxlength="100" class="w-full" />
      </UFormField>
      <UFormField label="Nama Sekolah" name="sekolah" required>
        <UInput v-model="sekolah" placeholder="Nama sekolah / satuan pendidikan" maxlength="100" class="w-full" />
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
  </div>
</template>
