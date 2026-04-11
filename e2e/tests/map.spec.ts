import { test, expect } from '@playwright/test'
import { injectFakeAuth } from '../helpers/auth'

test.describe('Map interactions', () => {
  test('map is rendered and shows Singapore', async ({ page }) => {
    await page.goto('/')
    // Leaflet renders tiles as <img> elements inside the map container
    await expect(page.locator('.leaflet-container')).toBeVisible()
  })

  test('clicking the map while logged in opens the upload modal', async ({ page }) => {
    await injectFakeAuth(page)
    await page.goto('/')

    // Wait for the map to be fully rendered
    const map = page.locator('.leaflet-container')
    await expect(map).toBeVisible()

    // Click near the centre of the map
    await map.click({ position: { x: 400, y: 300 } })

    // The upload modal should appear (first step is image selection)
    await expect(page.getByText(/drop your photo here/i).or(page.getByText(/choose a photo/i))).toBeVisible({ timeout: 3000 })
  })

  test('clicking the map while logged out does NOT open the upload modal', async ({ page }) => {
    await page.goto('/')
    const map = page.locator('.leaflet-container')
    await expect(map).toBeVisible()
    await map.click({ position: { x: 400, y: 300 } })
    // Modal should not appear
    await expect(page.getByText(/drop your photo here/i)).not.toBeVisible()
  })
})
