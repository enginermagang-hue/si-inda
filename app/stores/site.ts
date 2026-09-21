import { api, type AdminMe, type PublicSettings } from '~/composables/api'

export const useSiteStore = defineStore('site', () => {
  const settings = ref<PublicSettings>({
    site_name: 'SIINDAH — Layanan Dapodik',
    site_tagline: 'Microsite informasi dan pelayanan pendataan Dapodik',
    sop_drive_url: '',
    contact_wa: '',
    footer_text: '',
  })
  const loaded = ref(false)

  async function load(): Promise<void> {
    if (loaded.value) return
    try {
      const res = await api.get<{ data: Partial<PublicSettings> }>('/settings/public')
      settings.value = { ...settings.value, ...res.data }
    } catch {
      // Backend belum siap — pakai default agar halaman tetap render.
    } finally {
      loaded.value = true
    }
  }

  function refresh(): void {
    loaded.value = false
  }

  return { settings, loaded, load, refresh }
})

export const useAuthStore = defineStore('auth', () => {
  const admin = ref<AdminMe | null>(null)
  const checked = ref(false)

  async function check(): Promise<AdminMe | null> {
    try {
      const res = await api.get<{ data: AdminMe }>('/admin/me')
      admin.value = res.data
    } catch {
      admin.value = null
    } finally {
      checked.value = true
    }
    return admin.value
  }

  async function login(username: string, password: string): Promise<AdminMe> {
    const res = await api.post<{ data: AdminMe }>('/admin/login', { username, password })
    admin.value = res.data
    checked.value = true
    return res.data
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/admin/logout')
    } catch {
      // abaikan
    } finally {
      admin.value = null
    }
  }

  return { admin, checked, check, login, logout }
})
