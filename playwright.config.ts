import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const testDatabaseRoot = resolve('.local/postgres-test')
const testDatabaseSocket = resolve(testDatabaseRoot, 'socket')
process.env.DATABASE_URL = ''
process.env.DATABASE_NAME = `marketplace_b2b_test_e2e_${process.pid}`
process.env.DATABASE_SOCKET = testDatabaseSocket
process.env.LOCAL_DB_ROOT = testDatabaseRoot

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalTeardown: './tests/helpers/teardown-e2e-database.ts',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      "pnpm db:start && pnpm exec tsx tests/helpers/setup-e2e-database.ts && NODE_OPTIONS='--import ./instrument.server.mjs' pnpm exec vite dev --port 3001",
    url: 'http://127.0.0.1:3001/catalog',
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
})
