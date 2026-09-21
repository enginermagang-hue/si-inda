import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/site'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ----- Publik -----
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/statistik/:category(satuan-pendidikan|peserta-didik|guru|tendik)',
      name: 'statistik',
      component: () => import('../views/StatistikView.vue'),
    },
    { path: '/informasi/surat', name: 'surat', component: () => import('../views/SuratView.vue') },
    { path: '/informasi/link', name: 'link', component: () => import('../views/LinksView.vue') },
    { path: '/informasi/berita', name: 'berita', component: () => import('../views/BeritaView.vue') },
    {
      path: '/ptk/:slug',
      name: 'ptk',
      component: () => import('../views/ContentPageView.vue'),
    },
    {
      path: '/peserta-didik/:slug',
      name: 'peserta-didik',
      component: () => import('../views/ContentPageView.vue'),
    },
    {
      path: '/sarana/:slug',
      name: 'sarana',
      component: () => import('../views/ContentPageView.vue'),
    },
    { path: '/pengaduan', name: 'pengaduan', component: () => import('../views/PengaduanView.vue') },

    // ----- Admin -----
    { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/AdminLogin.vue') },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
        { path: 'statistik', name: 'admin-statistik', component: () => import('../views/admin/AdminStatistik.vue') },
        { path: 'halaman', name: 'admin-halaman', component: () => import('../views/admin/AdminPages.vue') },
        { path: 'surat', name: 'admin-surat', component: () => import('../views/admin/AdminLetters.vue') },
        { path: 'link', name: 'admin-link', component: () => import('../views/admin/AdminLinks.vue') },
        { path: 'berita', name: 'admin-berita', component: () => import('../views/admin/AdminNews.vue') },
        { path: 'pengaduan', name: 'admin-pengaduan', component: () => import('../views/admin/AdminComplaints.vue') },
        { path: 'pengaturan', name: 'admin-pengaturan', component: () => import('../views/admin/AdminSettings.vue') },
        { path: 'password', name: 'admin-password', component: () => import('../views/admin/AdminPassword.vue') },
      ],
    },

    // Fallback: halaman tidak dikenal → beranda
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAdmin && !to.path.startsWith('/admin')) return true
  if (to.name === 'admin-login') return true

  const auth = useAuthStore()
  const admin = auth.admin ?? (await auth.check())
  if (!admin) return '/admin/login'
  // Paksa ganti password awal sebelum mengelola konten
  if (admin.mustChangePassword && to.name !== 'admin-password') return '/admin/password'
  return true
})

export default router
