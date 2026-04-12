/**
 * Cat detail sidebar — Playwright practice
 *
 * These tests cover the right-side panel that appears when a cat marker is clicked.
 * All tests below are commented out for you to implement.
 *
 * Tip: API를 실제로 호출하거나 page.route()로 mock할 수 있어요.
 *   page.route('**/v1/cats', async (route) => {
 *     await route.fulfill({ json: { items: [MOCK_CAT], nextCursor: null } })
 *   })
 */

import { test, expect } from '@playwright/test'
import { injectFakeAuth } from '../helpers/auth'

// ---------------------------------------------------------------------------
// 연습 1: URL ?cat= 파라미터로 사이드바가 직접 열려야 함 (딥링크)
// ---------------------------------------------------------------------------
// test('sidebar opens directly when ?cat= is present in URL', async ({ page }) => {
//   // API mock (실제 백엔드 없이 테스트할 때)
//   page.route('**/v1/cats/cat-1', async (route) => {
//     await route.fulfill({
//       json: {
//         id: 'cat-1', title: 'Orange Tom', latitude: 1.3521, longitude: 103.8198,
//         status: 'active', likeCount: 3, photos: [],
//         imageKey: '', cdnUrl: 'https://cdn/img.jpg', thumbUrl: 'https://cdn/thumb.jpg',
//         uploadedAt: '2026-04-12T00:00:00Z',
//       },
//     })
//   })
//
//   await page.goto('/?cat=cat-1')
//   await expect(page.getByText('Orange Tom')).toBeVisible({ timeout: 5000 })
// })

// ---------------------------------------------------------------------------
// 연습 2: 사이드바의 X 버튼 클릭 시 닫혀야 함
// ---------------------------------------------------------------------------
// test('close button dismisses the sidebar', async ({ page }) => {
//   // ... 사이드바 열기
//   await page.goto('/?cat=cat-1')
//   await expect(page.getByText('Orange Tom')).toBeVisible({ timeout: 5000 })
//
//   await page.getByLabel('Close').click()
//   await expect(page.getByText('Orange Tom')).not.toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 3: 고양이 사진 클릭 시 전체화면 라이트박스가 열려야 함
// ---------------------------------------------------------------------------
// test('clicking the photo opens the fullscreen lightbox', async ({ page }) => {
//   await page.goto('/?cat=cat-1')
//   await expect(page.locator('.cursor-zoom-in')).toBeVisible({ timeout: 5000 })
//
//   await page.locator('.cursor-zoom-in').click()
//
//   // 라이트박스: 검정 배경 오버레이가 보여야 함
//   await expect(page.locator('.fixed.inset-0.bg-black\\/95')).toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 4: 라이트박스에서 Escape 키 누르면 닫혀야 함
// ---------------------------------------------------------------------------
// test('pressing Escape closes the lightbox', async ({ page }) => {
//   await page.goto('/?cat=cat-1')
//   await page.locator('.cursor-zoom-in').click()
//   await expect(page.locator('.fixed.inset-0.bg-black\\/95')).toBeVisible()
//
//   await page.keyboard.press('Escape')
//   await expect(page.locator('.fixed.inset-0.bg-black\\/95')).not.toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 5: 로그인 상태에서 좋아요 버튼을 클릭하면 숫자가 변해야 함
// ---------------------------------------------------------------------------
// test('like button increments like count when clicked', async ({ page }) => {
//   await injectFakeAuth(page)
//   // like API mock
//   await page.route('**/v1/cats/cat-1/like', async (route) => {
//     await route.fulfill({ json: { likeCount: 4, likedByMe: true } })
//   })
//
//   await page.goto('/?cat=cat-1')
//   const likeBtn = page.getByTitle(/like/i)
//   await expect(likeBtn).toBeEnabled()
//   await likeBtn.click()
//
//   await expect(page.getByText('4')).toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 6: 소유자에게만 Edit/Delete 버튼이 보여야 함
// ---------------------------------------------------------------------------
// test('Edit and Delete buttons are visible to the owner', async ({ page }) => {
//   // 로그인 유저 ID와 cat.userId가 일치하는 케이스
//   await injectFakeAuth(page)
//   await page.goto('/?cat=cat-1')
//   await expect(page.getByRole('button', { name: /^edit$/i })).toBeVisible({ timeout: 5000 })
//   await expect(page.getByRole('button', { name: /delete/i })).toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 7: Share 버튼 클릭 시 URL이 클립보드에 복사되어야 함
// ---------------------------------------------------------------------------
// test('share button copies the cat URL to clipboard', async ({ page, context }) => {
//   await context.grantPermissions(['clipboard-read', 'clipboard-write'])
//   await page.goto('/?cat=cat-1')
//   await expect(page.getByText('Orange Tom')).toBeVisible({ timeout: 5000 })
//
//   await page.getByLabel('Share').click()
//
//   const clipboard = await page.evaluate(() => navigator.clipboard.readText())
//   expect(clipboard).toContain('?cat=cat-1')
// })

// ---------------------------------------------------------------------------
// 연습 8: 삭제 확인 후 사이드바가 닫히고 마커가 없어져야 함
// ---------------------------------------------------------------------------
// test('deleting a cat closes sidebar and removes the marker', async ({ page }) => {
//   await injectFakeAuth(page)
//   await page.route('**/v1/cats/cat-1', async (route) => {
//     if (route.request().method() === 'DELETE') {
//       await route.fulfill({ json: { message: 'Cat removed' } })
//     }
//   })
//
//   await page.goto('/?cat=cat-1')
//   await page.getByRole('button', { name: /delete/i }).click()
//   await page.getByRole('button', { name: /confirm delete/i }).click()
//
//   await expect(page.getByText('Orange Tom')).not.toBeVisible({ timeout: 5000 })
// })
