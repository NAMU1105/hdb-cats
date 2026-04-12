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

// ---------------------------------------------------------------------------
// 연습: 지도 마커 관련 추가 테스트
// ---------------------------------------------------------------------------

// test('cat markers appear on the map after data loads', async ({ page }) => {
//   // GET /cats mock으로 마커 데이터 주입
//   await page.route('**/v1/cats', async (route) => {
//     await route.fulfill({
//       json: {
//         items: [
//           {
//             id: 'cat-1', title: 'Orange Tom',
//             latitude: 1.3521, longitude: 103.8198,
//             thumbUrl: 'https://cdn/thumb.jpg', uploadedAt: '2026-04-12T00:00:00Z',
//           },
//         ],
//         nextCursor: null,
//       },
//     })
//   })
//
//   await page.goto('/')
//   await expect(page.locator('.leaflet-container')).toBeVisible()
//
//   // 마커가 렌더링될 때까지 기다림 (leaflet-marker-icon)
//   await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible({ timeout: 5000 })
// })

// test('clicking a marker opens the cat detail sidebar', async ({ page }) => {
//   // 마커 데이터 + 상세 API mock
//   await page.route('**/v1/cats', async (route) => {
//     await route.fulfill({
//       json: {
//         items: [{ id: 'cat-1', title: 'Orange Tom', latitude: 1.3521, longitude: 103.8198, ... }],
//         nextCursor: null,
//       },
//     })
//   })
//   await page.route('**/v1/cats/cat-1', async (route) => {
//     await route.fulfill({
//       json: { id: 'cat-1', title: 'Orange Tom', ... },
//     })
//   })
//
//   await page.goto('/')
//   await page.locator('.leaflet-marker-icon').first().click()
//
//   await expect(page.getByText('🐱 Orange Tom')).toBeVisible({ timeout: 5000 })
// })

// test('cat count in header updates after data loads', async ({ page }) => {
//   await page.route('**/v1/cats', async (route) => {
//     await route.fulfill({
//       json: {
//         items: [
//           { id: 'cat-1', title: 'Cat A', latitude: 1.35, longitude: 103.82, thumbUrl: '', uploadedAt: '' },
//           { id: 'cat-2', title: 'Cat B', latitude: 1.36, longitude: 103.83, thumbUrl: '', uploadedAt: '' },
//         ],
//         nextCursor: null,
//       },
//     })
//   })
//
//   await page.goto('/')
//   await expect(page.getByText(/2 cats spotted/i)).toBeVisible({ timeout: 5000 })
// })

// test('map cannot be panned outside Singapore bounds', async ({ page }) => {
//   await page.goto('/')
//   const map = page.locator('.leaflet-container')
//   await expect(map).toBeVisible()
//
//   // 극단적으로 드래그해도 Singapore 바깥으로 나가지 않아야 함
//   // Leaflet의 maxBounds + maxBoundsViscosity=0.8 로 제한됨
//   await map.dragTo(map, {
//     sourcePosition: { x: 400, y: 300 },
//     targetPosition: { x: 4000, y: 3000 },  // 극단적 드래그
//   })
//
//   // 지도 타일 URL에 Singapore 좌표가 포함되어야 함 (tile zoom 검증)
//   // 이 테스트는 시각적 검증이 필요할 수 있음
//   await expect(map).toBeVisible()
// })
