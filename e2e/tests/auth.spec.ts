import { test, expect } from '@playwright/test'
import { injectFakeAuth } from '../helpers/auth'

test.describe('Authentication', () => {
  test('shows Google sign-in button when logged out', async ({ page }) => {
    await page.goto('/')
    // The Google Sign-In iframe renders inside a div with role="button"
    // We check that the "Spot a Cat" button is NOT visible when logged out
    await expect(page.getByRole('button', { name: /spot a cat/i })).not.toBeVisible()
  })

  test('shows user name and "Spot a Cat" button when logged in', async ({ page }) => {
    await injectFakeAuth(page)
    await page.goto('/')
    await expect(page.getByText('E2E Cat Fan')).toBeVisible()
    await expect(page.getByRole('button', { name: /spot a cat/i })).toBeVisible()
  })

  test('logs out when clicking Logout', async ({ page }) => {
    await injectFakeAuth(page)
    await page.goto('/')
    await page.getByRole('button', { name: /logout/i }).click()
    await expect(page.getByRole('button', { name: /spot a cat/i })).not.toBeVisible()
    // localStorage should be cleared
    const stored = await page.evaluate(() => localStorage.getItem('hdb_cats_auth'))
    expect(stored).toBeNull()
  })
})
