import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { assertDemoSeedAllowed } from '../../src/server/db/seed-guard'

describe('demo seed guard', () => {
  test('allows the private local development database', () => {
    assert.doesNotThrow(() => assertDemoSeedAllowed({}))
  })

  test('always rejects production', () => {
    assert.throws(
      () =>
        assertDemoSeedAllowed({
          NODE_ENV: 'production',
          ALLOW_DEMO_SEED: 'true',
        }),
      /disabled in production/,
    )
  })

  test('requires explicit opt-in for an external database', () => {
    assert.throws(
      () =>
        assertDemoSeedAllowed({
          DATABASE_URL: 'postgresql://localhost/marketplace_demo',
        }),
      /ALLOW_DEMO_SEED=true/,
    )
    assert.doesNotThrow(() =>
      assertDemoSeedAllowed({
        DATABASE_URL: 'postgresql://localhost/marketplace_demo',
        ALLOW_DEMO_SEED: 'true',
      }),
    )
  })
})
