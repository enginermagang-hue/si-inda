export default defineNuxtPlugin(() => {
  const route = useRoute()
  let lastPath = ''

  async function track(path: string) {
    if (!path || path.startsWith('/admin') || path.startsWith('/api')) return
    if (path === lastPath) return
    // client-side dedupe via sessionStorage 5min
    try {
      const key = `siindah_last_${path}`
      const last = sessionStorage.getItem(key)
      if (last && Date.now() - Number(last) < 5 * 60 * 1000) return
      sessionStorage.setItem(key, String(Date.now()))
    } catch (_e) { void _e }
    lastPath = path
    try {
      await $fetch('/api/visits/track', {
        method: 'POST',
        body: { path, referer: document.referrer || null },
        credentials: 'include',
      })
    } catch (_e) { void _e }
  }

  // initial
  onMounted(() => track(route.path))
  // on navigation
  watch(() => route.path, (p) => track(p))
})
