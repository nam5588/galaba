import { defineConfig, devices } from '@playwright/test'

// FD1 데모 흐름 E2E. 루트에서 `npm run e2e` (프론트 3000 + 백엔드 4100을 띄우거나, 떠 있으면 그대로 쓴다)
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: { baseURL: 'http://localhost:3000', ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  webServer: {
    command: 'npm --prefix .. run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
