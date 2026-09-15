import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { enterDemo, mutateDemo, readDemo } from '../src/features/purchase/demo.server'

const http = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  request: new Request('https://demo.example/demo', { headers: { origin: 'https://demo.example' } }),
  options: {},
  headers: new Map<string, string>(),
}))
vi.mock('@tanstack/react-start/server', () => ({
  getCookie: () => http.cookie,
  getRequest: () => http.request,
  setCookie: (_name: string, value: string, options: Record<string, unknown>) => { http.cookie = value; http.options = options },
  setResponseHeader: (key: string, value: string) => http.headers.set(key, value),
}))
const add = { type: 'cart' as const, productId: 'packing', quantity: 100 }
const address = { recipient: 'Buyer Demo', phone: '081234567890', street: 'Jalan Demo 12', city: 'Surabaya' }
beforeEach(() => {
  vi.unstubAllEnvs()
  http.cookie = undefined
  http.request = new Request('https://demo.example/demo', { headers: { origin: 'https://demo.example' } })
})
describe('demo server boundary (HTTP adapters mocked)', () => {
  it('S01 rejects mutation without an established session', () => {
    expect(readDemo()).toBeNull()
    expect(() => mutateDemo(randomUUID(), add)).toThrow('Sesi demo berakhir')
  })
  it('S02 rejects cross-origin writes and missing Origin', () => {
    enterDemo('buyer', true)
    for (const origin of ['https://other.example', '']) {
      http.request = new Request('https://demo.example/demo', { headers: { origin } })
      expect(() => mutateDemo(randomUUID(), add)).toThrow('Asal permintaan')
    }
  })
  it('S03 isolates browser sessions and sets cookie/cache attributes', () => {
    enterDemo('buyer', true)
    const first = http.cookie
    mutateDemo(randomUUID(), add)
    http.cookie = undefined
    expect(enterDemo('buyer', true).state.cart).toEqual({})
    expect(http.cookie).not.toBe(first)
    expect(http.options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'strict' })
    expect(http.headers.get('Cache-Control')).toBe('no-store')
    http.cookie = first
    expect(readDemo()?.state.cart).toEqual({ packing: 100 })
  })
  it('S04 checkout retries with the same request ID create exactly one purchase', () => {
    enterDemo('buyer', true)
    mutateDemo(randomUUID(), add)
    const id = randomUUID()
    const checkout = { type: 'checkout' as const, expectedTotal: 575000, address }
    const first = mutateDemo(id, checkout)
    const again = mutateDemo(id, checkout)
    expect(first.state.purchases).toHaveLength(1)
    expect(again.state).toEqual(first.state)
    expect(again.state.products[0].reserved).toBe(100)
    expect(() => mutateDemo(id, add)).toThrow('ID permintaan')
  })
  it('S05 persona rotation invalidates the previous token and enforces domain role', () => {
    enterDemo('buyer', true)
    const old = http.cookie
    enterDemo('supplier-a', false)
    const current = http.cookie
    expect(mutateDemo(randomUUID(), add).error?.code).toBe('FORBIDDEN')
    http.cookie = old
    expect(readDemo()).toBeNull()
    http.cookie = current
    expect(readDemo()?.actor).toBe('supplier-a')
  })
  it('S06 expired sessions require a fresh start', () => {
    const clock = vi.spyOn(Date, 'now')
    clock.mockReturnValue(100000)
    enterDemo('buyer', true)
    clock.mockReturnValue(100000 + 86400001)
    expect(readDemo()).toBeNull()
    clock.mockRestore()
  })
  it('S07 production demo requires an explicit server flag', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('B2B_DEMO_ENABLED', 'false')
    expect(() => enterDemo('buyer', true)).toThrow('tidak diaktifkan')
    vi.stubEnv('B2B_DEMO_ENABLED', 'true')
    expect(enterDemo('buyer', true).actor).toBe('buyer')
  })
  it('S08 role switching preserves checkout and supplier payload hides unrelated orders', () => {
    enterDemo('buyer', true)
    mutateDemo(randomUUID(), add)
    mutateDemo(randomUUID(), { type: 'cart', productId: 'large', quantity: 50 })
    const p = mutateDemo(randomUUID(), { type: 'checkout', expectedTotal: 995000, address }).state.purchases[0]
    mutateDemo(randomUUID(), { type: 'payment', purchaseId: p.id, result: 'paid', amount: p.total })
    const supplier = enterDemo('supplier-a', false)
    expect(supplier.state.purchases[0].orders).toHaveLength(1)
    expect(supplier.state.purchases[0].total).toBe(575000)
    expect(enterDemo('buyer', false).state.purchases[0].orders).toHaveLength(2)
  })
})
