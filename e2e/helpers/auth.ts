import type { Page } from '@playwright/test'

/**
 * Injects a fake (but structurally valid) auth session into localStorage,
 * bypassing the real Google OAuth popup in E2E tests.
 *
 * The token exp is set 1 hour in the future so AuthContext treats it as valid.
 */
export async function injectFakeAuth(page: Page, user = { email: 'e2e@hdb.sg', name: 'E2E Cat Fan' }) {
  const exp = Math.floor(Date.now() / 1000) + 3600
  const payload = { sub: 'e2e-user-1', email: user.email, name: user.name, exp }
  const fakeToken = [
    btoa(JSON.stringify({ alg: 'RS256' })),
    btoa(JSON.stringify(payload)),
    'fake-signature',
  ].join('.')

  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value)
  }, {
    key: 'hdb_cats_auth',
    value: JSON.stringify({ credential: fakeToken, email: user.email, name: user.name }),
  })
}
