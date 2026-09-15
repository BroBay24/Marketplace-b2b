import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000/demo',
    reuseExistingServer: false,
    env: {
      VITE_APP_NAME: 'Marketplace B2B',
      VITE_GRAPHQL_URL: 'http://localhost:4000/graphql',
    },
  },
})
