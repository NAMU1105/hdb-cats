/**
 * Upload flow — Playwright practice
 *
 * These tests cover the 3-step "Spot a Cat" upload wizard.
 * All tests below are commented out for you to implement.
 * Run with: npx playwright test e2e/tests/upload.spec.ts
 *
 * Helpers available:
 *   import { injectFakeAuth } from '../helpers/auth'
 *   → injects a fake Google auth session without a real OAuth popup
 */

import { test, expect } from '@playwright/test'
import { injectFakeAuth } from '../helpers/auth'

// ---------------------------------------------------------------------------
// 연습 1: 업로드 모달이 열리는지 확인
// ---------------------------------------------------------------------------
// test('"Spot a Cat" button opens the upload modal when logged in', async ({ page }) => {
//   await injectFakeAuth(page)
//   await page.goto('/')
//
//   // "Spot a Cat" 버튼 클릭
//   await page.getByRole('button', { name: /spot a cat/i }).click()
//
//   // 1단계: 사진 선택 화면이 보여야 함
//   await expect(page.getByText(/drop a cat photo here/i)).toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 2: 로그아웃 상태에선 버튼이 비활성화되어야 함
// ---------------------------------------------------------------------------
// test('"Spot a Cat" button is disabled when logged out', async ({ page }) => {
//   await page.goto('/')
//   const btn = page.getByRole('button', { name: /spot a cat/i })
//   await expect(btn).toBeDisabled()
// })

// ---------------------------------------------------------------------------
// 연습 3: 모달 닫기
// ---------------------------------------------------------------------------
// test('closing the modal returns to idle state', async ({ page }) => {
//   await injectFakeAuth(page)
//   await page.goto('/')
//   await page.getByRole('button', { name: /spot a cat/i }).click()
//   await expect(page.getByText(/drop a cat photo here/i)).toBeVisible()
//
//   // X 버튼 클릭
//   await page.getByRole('button', { name: /close/i }).click()
//
//   // 모달이 사라져야 함
//   await expect(page.getByText(/drop a cat photo here/i)).not.toBeVisible()
// })

// ---------------------------------------------------------------------------
// 연습 4: 사진 업로드 → 위치 선택 → 상세 입력 전체 플로우
// ---------------------------------------------------------------------------
// test('completes full upload wizard (photo → location → details)', async ({ page }) => {
//   // NOTE: 이 테스트는 API를 mock하거나 실제 서버가 필요합니다.
//   await injectFakeAuth(page)
//   await page.goto('/')
//
//   // 1단계: 사진 선택
//   await page.getByRole('button', { name: /spot a cat/i }).click()
//   const fileInput = page.locator('input[type="file"]').first()
//   await fileInput.setInputFiles('e2e/fixtures/test-cat.jpg')  // 테스트용 이미지 필요
//
//   // 2단계: 지도에서 위치 클릭
//   await expect(page.getByText(/click the map/i)).toBeVisible()
//   await page.locator('.leaflet-container').click({ position: { x: 400, y: 300 } })
//
//   // 3단계: 상세 정보 입력
//   await expect(page.getByPlaceholder(/cat's name/i)).toBeVisible()
//   await page.getByPlaceholder(/cat's name/i).fill('Test Cat')
//   await page.getByRole('button', { name: /submit/i }).click()
//
//   // 성공 메시지 확인
//   await expect(page.getByText(/spotted/i)).toBeVisible({ timeout: 10000 })
// })

// ---------------------------------------------------------------------------
// 연습 5: 필수 필드(이름) 없이 제출 시 비활성화
// ---------------------------------------------------------------------------
// test('Submit button is disabled when title is empty', async ({ page }) => {
//   await injectFakeAuth(page)
//   await page.goto('/')
//   await page.getByRole('button', { name: /spot a cat/i }).click()
//
//   // 사진과 위치는 주어졌다고 가정하고 details 단계로 이동 (state 조작 or 단계 강제)
//   // ...filling-details 단계에서:
//   const submitBtn = page.getByRole('button', { name: /submit/i })
//   await expect(submitBtn).toBeDisabled()
// })

// ---------------------------------------------------------------------------
// 연습 6: Back 버튼이 이전 단계로 돌아가는지 확인
// ---------------------------------------------------------------------------
// test('Back button returns to the previous step', async ({ page }) => {
//   await injectFakeAuth(page)
//   await page.goto('/')
//   await page.getByRole('button', { name: /spot a cat/i }).click()
//
//   // 사진 선택 → 위치 선택 단계로 이동 (사진 파일 입력 후)
//   const fileInput = page.locator('input[type="file"]').first()
//   await fileInput.setInputFiles('e2e/fixtures/test-cat.jpg')
//
//   // Back 버튼 클릭
//   await page.getByRole('button', { name: /back/i }).click()
//
//   // 다시 사진 선택 화면으로 돌아와야 함
//   await expect(page.getByText(/drop a cat photo here/i)).toBeVisible()
// })
