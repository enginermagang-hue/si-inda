import { useAuthStore } from '~/stores/site'

// Guard halaman /admin/* : wajib login; paksa ganti password awal.
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return
  // Di server (SSR) cookie httpOnly tak tersedia untuk $fetch klien —
  // lewati di server, verifikasi ulang di klien.
  if (import.meta.server) return
  const auth = useAuthStore()
  const admin = auth.admin ?? (await auth.check())
  if (!admin) return navigateTo('/admin/login')
  if (admin.mustChangePassword && to.path !== '/admin/password') {
    return navigateTo('/admin/password')
  }
})
