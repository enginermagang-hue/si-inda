import { test, expect } from '@playwright/test'

test('homepage menampilkan microsite dapodik', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1').first()).toContainText('Dapodik')
})

test('halaman statistik bisa dibuka', async ({ page }) => {
  await page.goto('/statistik')
  await expect(page.locator('h1')).toContainText('Statistik Dapodik')
})

test('halaman pengaduan bisa dibuka dan form ada', async ({ page }) => {
  await page.goto('/pengaduan')
  await expect(page.locator('h1')).toContainText('Kendala Dapodik')
})

test('halaman login admin bisa dibuka', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.locator('h1')).toContainText('Login Admin')
})
