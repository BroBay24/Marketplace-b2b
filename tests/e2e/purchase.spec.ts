import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function begin(page: Page) {
  await page.goto('/demo')
  await page.getByRole('button', { name: 'Mulai demo sebagai Buyer' }).click()
  await page.getByRole('button', { name: 'Tambah 100 pcs' }).click()
  await expect(page.getByRole('status')).toContainText('tersedia di keranjang')
  await page.getByRole('button', { name: 'Tambah 50 pcs' }).click()
  await expect(page.getByRole('status')).toContainText('Kardus Kirim')
  await page.getByRole('button', { name: /Keranjang/ }).click()
  await expect(page.getByTestId('cart-total')).toContainText('995.000')
  await page.getByRole('button', { name: 'Lanjut checkout' }).click()
  await page.getByRole('button', { name: 'Buat pesanan', exact: true }).click()
  await expect(page.getByText('CHK-DEMO-0001-PAY-1', { exact: true })).toBeVisible()
}
async function persona(page: Page, value: string) {
  await page.getByLabel('Lanjutkan sebagai').selectOption(value)
  await page.getByRole('button', { name: 'Buka workspace' }).click()
  await expect(page.getByRole('button', { name: 'Buka workspace' })).toBeDisabled()
}
async function ship(page: Page, who: string) {
  await persona(page, who)
  await page.getByRole('button', { name: 'Mulai pengemasan' }).click()
  await page.getByRole('button', { name: 'Masukkan resi & kirim' }).click()
  await page.getByLabel('Nomor resi demo').fill(`DEMO-${who}`)
  await page.getByRole('button', { name: 'Simpan & lanjutkan' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}
async function receive(page: Page, who: string) {
  await page.getByTestId(`order-${who}`).getByRole('button', { name: 'Periksa & terima barang' }).click()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Konfirmasi barang diterima' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}
test('E01 two suppliers: retry payment, ship independently, receive, reload history', async ({ page }) => {
  await begin(page)
  await page.getByRole('button', { name: 'Gagal', exact: true }).click()
  await page.getByRole('button', { name: 'Coba pembayaran lagi' }).click()
  await expect(page.getByText('CHK-DEMO-0001-PAY-2', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Simulasikan pembayaran berhasil' }).click()
  await ship(page, 'supplier-a')
  await ship(page, 'supplier-b')
  await persona(page, 'buyer')
  await receive(page, 'supplier-a')
  await expect(page.getByText('Sebagian selesai', { exact: true })).toBeVisible()
  await expect(page.getByTestId('order-supplier-b')).toContainText('Dikirim')
  await receive(page, 'supplier-b')
  await expect(page.getByText('Semua selesai', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: /Pesanan/ }).click()
  await expect(page.getByText('Semua selesai', { exact: true })).toBeVisible()
})
test('E02 mobile dark theme and explicit receive dialog', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await begin(page)
  await page.getByRole('button', { name: 'Simulasikan pembayaran berhasil' }).click()
  await ship(page, 'supplier-a')
  await persona(page, 'buyer')
  await page.getByRole('button', { name: 'Gunakan Dark Mode' }).click()
  await page.getByTestId('order-supplier-a').getByRole('button', { name: 'Periksa & terima barang' }).click()
  await expect(page.getByRole('dialog')).toHaveClass(/dark/)
  await expect(page.getByRole('checkbox')).not.toBeChecked()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
test('E03 expiry releases the pending purchase and offers no retry', async ({ page }) => {
  await begin(page)
  await page.getByRole('button', { name: 'Kedaluwarsa', exact: true }).click()
  await expect(page.getByText('Reservasi stok telah dilepas.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Coba pembayaran lagi' })).toHaveCount(0)
})
