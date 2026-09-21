import { test, expect } from '@playwright/test'

// See here how to get started:
// https://playwright.dev/docs/intro
test('homepage menampilkan microsite dapodik', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Dapodik')
})

test('halaman pengaduan bisa dibuka', async ({ page }) => {
  await page.goto('/pengaduan')
  await expect(page.locator('h1')).toContainText('Kendala Dapodik')
})

test('halaman login admin bisa dibuka', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.locator('h1')).toContainText('Login Admin')
})
