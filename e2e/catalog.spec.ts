import { execFileSync } from 'node:child_process'
import { expect, test } from '@playwright/test'

const productA = 'Kardus Packing Ukuran 30×20×15 cm'
const productB = 'Kardus Kirim Ukuran Besar'

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.includes('initial SSR')) return
  await page.goto('/catalog')
  await expect(page.locator('.marketplace-shell')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
})

test('renders catalog in the initial SSR response', async ({ request }) => {
  const response = await request.get('/catalog')
  expect(response.ok()).toBeTruthy()
  const html = await response.text()
  expect(html).toContain(productA)
  expect(html).toContain(productB)
})

test('supports client search, category, sorting, detail, and 404', async ({
  page,
}) => {
  await expect(
    page.getByRole('heading', { name: 'Temukan kebutuhan bisnis' }),
  ).toBeVisible()

  const productLinks = page.locator('.catalog-product-link')
  await page
    .getByRole('combobox', { name: 'Urutkan produk' })
    .selectOption('price-desc')
  await expect(productLinks.nth(0)).toHaveAttribute(
    'aria-label',
    `Lihat ${productB}`,
  )
  await expect(productLinks.nth(1)).toHaveAttribute(
    'aria-label',
    `Lihat ${productA}`,
  )

  const search = page.getByRole('searchbox', { name: 'Cari produk atau SKU' })
  await search.fill('KRD302015')
  await page.getByRole('button', { name: 'Cari' }).click()
  await expect(page).toHaveURL(/q=KRD302015/)
  await expect(
    page.getByRole('link', { name: `Lihat ${productA}` }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: `Lihat ${productB}` }),
  ).toHaveCount(0)

  await page.getByRole('link', { name: 'Kardus', exact: true }).click()
  await expect(page).toHaveURL(/category=kardus/)

  await page.getByRole('link', { name: `Lihat ${productA}` }).click()
  await expect(page.getByRole('heading', { name: productA })).toBeVisible()
  await expect(page).toHaveURL(/\/catalog\/[0-9a-f-]+$/)
  await page.getByRole('link', { name: 'Kembali ke katalog' }).click()
  await expect(page).toHaveURL(/\/catalog/)

  await page.goto('/catalog/not-a-uuid')
  await expect(
    page.getByRole('heading', { name: 'Produk tidak ditemukan' }),
  ).toBeVisible()
})

test('shows empty search state and resets filters', async ({ page }) => {
  await page
    .getByRole('searchbox', { name: 'Cari produk atau SKU' })
    .fill('TIDAKADA')
  await page.getByRole('button', { name: 'Cari' }).click()
  await expect(
    page.getByRole('heading', { name: 'Produk belum ditemukan' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Lihat semua produk' }).click()
  await expect(page.getByText('2 produk', { exact: true })).toBeVisible()
})

test('recovers from a temporary catalog service failure', async ({ page }) => {
  const database = (action: 'start' | 'stop') =>
    execFileSync('pnpm', [`db:${action}`], { cwd: process.cwd() })
  database('stop')
  try {
    await page
      .getByRole('searchbox', { name: 'Cari produk atau SKU' })
      .fill('KRD')
    await page.getByRole('button', { name: 'Cari' }).click()
    await expect(
      page.getByRole('heading', { name: 'Katalog belum dapat dimuat' }),
    ).toBeVisible()
    database('start')
    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(page.getByText('2 produk untuk “KRD”')).toBeVisible()
  } finally {
    database('start')
  }
})

test('calculates all-units prices and validates quantity', async ({ page }) => {
  await page.goto('/catalog/40000000-0000-4000-8000-000000000001')
  await expect(page.locator('.marketplace-shell')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  const quantity = page.getByRole('spinbutton', { name: 'Jumlah (pcs)' })

  const estimate = page.locator('.catalog-estimate-result')
  await quantity.fill('500')
  await expect(estimate).toContainText(/Rp\s5\.500 × 500/)
  await expect(estimate).toContainText(/Rp\s2\.750\.000/)

  await quantity.fill('501')
  await expect(estimate).toContainText(/Rp\s5\.000 × 501/)
  await expect(estimate).toContainText(/Rp\s2\.505\.000/)

  await quantity.fill('99')
  await expect(page.getByText('Jumlah minimum 100 pcs.')).toBeVisible()
})

test('persists theme through reload and client navigation', async ({
  page,
}) => {
  const toggle = page.getByRole('button', { name: 'Gunakan tema gelap' })
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute(
    'data-catalog-theme',
    'dark',
  )
  await expect(
    page.getByRole('button', { name: 'Gunakan tema terang' }),
  ).toBeVisible()

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute(
    'data-catalog-theme',
    'dark',
  )
  await expect(page.locator('.marketplace-shell')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  await page.getByRole('link', { name: `Lihat ${productA}` }).click()
  await expect(page.locator('html')).toHaveAttribute(
    'data-catalog-theme',
    'dark',
  )
})

for (const viewport of [
  { width: 360, height: 800 },
  { width: 412, height: 900 },
  { width: 768, height: 1024 },
]) {
  test(`remains usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await expect(page.getByRole('main')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  })
}

test('supports keyboard skip navigation and 200% text', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Lewati ke konten' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#catalog-content')).toBeFocused()

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('meets key target-size and text-contrast checks in both themes', async ({
  page,
}) => {
  for (const name of ['Cari', 'Gunakan tema gelap']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(48)
  }
  const categoryBox = await page
    .getByRole('link', { name: 'Kardus', exact: true })
    .boundingBox()
  expect(categoryBox?.height).toBeGreaterThanOrEqual(48)

  const contrast = async (selector: string) =>
    page.locator(selector).evaluate((element) => {
      const parse = (value: string) =>
        value
          .match(/[\d.]+/g)
          ?.slice(0, 3)
          .map(Number) ?? [0, 0, 0]
      const luminance = (rgb: number[]) => {
        const values = rgb.map((value) => {
          const channel = value / 255
          return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]
      }
      const style = getComputedStyle(element)
      const shell = document.querySelector('.marketplace-shell')
      const foreground = luminance(parse(style.color))
      const background = luminance(
        parse(getComputedStyle(shell ?? element).backgroundColor),
      )
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      )
    })

  expect(await contrast('.catalog-description')).toBeGreaterThanOrEqual(4.5)
  await page.getByRole('button', { name: 'Gunakan tema gelap' }).click()
  expect(await contrast('.catalog-description')).toBeGreaterThanOrEqual(4.5)
})

test('loads catalog without uncaught browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.reload()
  await expect(page.locator('.marketplace-shell')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  expect(errors).toEqual([])
})
