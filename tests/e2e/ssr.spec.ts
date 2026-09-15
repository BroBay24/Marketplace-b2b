import { expect, test } from '@playwright/test'

test('H01 /demo renders the welcome page through the real Start HTTP server', async ({ request }) => {
  const response = await request.get('/demo')
  expect(response.status()).toBe(200)
  const html = await response.text()
  expect(html).toContain('Mulai demo sebagai Buyer')
  expect(html).toContain('Pembayaran disimulasikan')
  expect(html).not.toContain('Something went wrong')
})
test('H02 /catalog redirects to the implemented demo', async ({ request }) => {
  const response = await request.get('/catalog', { maxRedirects: 0 })
  expect(response.status()).toBe(307)
  expect(response.headers().location).toContain('/demo')
})
