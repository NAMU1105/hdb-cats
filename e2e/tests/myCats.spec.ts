/**
 * My Cats panel — Playwright practice
 *
 * These tests cover the "My Cats" left-slide panel that shows your own sightings.
 * All tests below are commented out for you to implement.
 *
 * Tip: page.route()로 GET /cats/me를 mock하면 실제 서버 없이 테스트할 수 있어요.
 */

import { test, expect } from '@playwright/test'
import { injectFakeAuth } from '../helpers/auth'

// ---------------------------------------------------------------------------
// 연습 1: 로그인 상태에서만 "My Cats" 버튼이 보여야 함
// ---------------------------------------------------------------------------
// test('"My Cats" button is visible only when logged in', async ({ page }) => {
//   // 로그아웃 상태
//   await page.goto('/')
//   await expect(page.getByRole('button', { name: /my cats/i })).not.toBeVisible()
//
//   // 로그인 상태
//   await injectFakeAuth(page)
//   await page.goto('/')
//   await expect(page.getByRole('button', { name: /my cats/i })).toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 2: "My Cats" 버튼 클릭 → 패널이 슬라이드 인
// ---------------------------------------------------------------------------
// test('clicking "My Cats" opens the panel', async ({ page }) => {
//   await injectFakeAuth(page)
//   await page.goto('/')
//
//   await page.getByRole('button', { name: /my cats/i }).click()
//
//   // 패널 헤더가 보여야 함
//   await expect(page.getByText('🐾 My Cats')).toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 3: 패널에 본인 고양이 목록이 표시되어야 함
// ---------------------------------------------------------------------------
// test('panel shows the list of user\'s cats', async ({ page }) => {
//   await injectFakeAuth(page)
//
//   // GET /cats/me mock
//   await page.route('**/v1/cats/me', async (route) => {
//     await route.fulfill({
//       json: {
//         items: [
//           { id: 'cat-1', title: 'My Orange Tom', latitude: 1.35, longitude: 103.82,
//             thumbUrl: 'https://cdn/thumb.jpg', uploadedAt: '2026-04-12T00:00:00Z', town: 'Bedok' },
//         ],
//       },
//     })
//   })
//
//   await page.goto('/')
//   await page.getByRole('button', { name: /my cats/i }).click()
//
//   await expect(page.getByText('My Orange Tom')).toBeVisible({ timeout: 5000 })
// })

// ---------------------------------------------------------------------------
// 연습 4: 고양이 없을 때 빈 상태 메시지가 표시되어야 함
// ---------------------------------------------------------------------------
// test('shows empty state message when user has no cats', async ({ page }) => {
//   await injectFakeAuth(page)
//
//   await page.route('**/v1/cats/me', async (route) => {
//     await route.fulfill({ json: { items: [] } })
//   })
//
//   await page.goto('/')
//   await page.getByRole('button', { name: /my cats/i }).click()
//
//   await expect(page.getByText(/no cats spotted yet/i)).toBeVisible({ timeout: 5000 })
// })

// ---------------------------------------------------------------------------
// 연습 5: 패널에서 고양이 클릭 → 패널 닫히고 사이드바 열림
// ---------------------------------------------------------------------------
// test('clicking a cat in the panel closes panel and opens sidebar', async ({ page }) => {
//   await injectFakeAuth(page)
//
//   await page.route('**/v1/cats/me', async (route) => {
//     await route.fulfill({
//       json: { items: [{ id: 'cat-1', title: 'My Orange Tom', ... }] },
//     })
//   })
//   await page.route('**/v1/cats/cat-1', async (route) => {
//     await route.fulfill({ json: { id: 'cat-1', title: 'My Orange Tom', ... } })
//   })
//
//   await page.goto('/')
//   await page.getByRole('button', { name: /my cats/i }).click()
//   await page.getByText('My Orange Tom').click()
//
//   // My Cats 패널은 닫혀야 함
//   await expect(page.getByText('🐾 My Cats')).not.toBeVisible()
//   // Cat detail 사이드바가 열려야 함
//   await expect(page.getByText('🐱 My Orange Tom')).toBeVisible({ timeout: 5000 })
// })

// ---------------------------------------------------------------------------
// 연습 6: 패널 바깥 영역(backdrop) 클릭 시 패널이 닫혀야 함
// ---------------------------------------------------------------------------
// test('clicking outside the panel closes it', async ({ page }) => {
//   await injectFakeAuth(page)
//   await page.route('**/v1/cats/me', async (route) => {
//     await route.fulfill({ json: { items: [] } })
//   })
//
//   await page.goto('/')
//   await page.getByRole('button', { name: /my cats/i }).click()
//   await expect(page.getByText('🐾 My Cats')).toBeVisible()
//
//   // backdrop (패널 바깥 투명 오버레이) 클릭
//   await page.locator('.fixed.inset-0.z-\\[998\\]').click()
//
//   await expect(page.getByText('🐾 My Cats')).not.toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 7: 패널의 X 버튼 클릭 시 닫혀야 함
// ---------------------------------------------------------------------------
// test('close button in panel header dismisses the panel', async ({ page }) => {
//   await injectFakeAuth(page)
//   await page.route('**/v1/cats/me', async (route) => {
//     await route.fulfill({ json: { items: [] } })
//   })
//
//   await page.goto('/')
//   await page.getByRole('button', { name: /my cats/i }).click()
//   await expect(page.getByText('🐾 My Cats')).toBeVisible()
//
//   await page.getByLabel('Close').click()
//   await expect(page.getByText('🐾 My Cats')).not.toBeVisible()
// })
