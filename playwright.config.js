// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
dotenv.config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Limit workers to control memory: 2 on CI, 4 locally */
  workers: process.env.CI ? 2 : 4,
  /* CI: github (inline PR annotations) + html — Local: html only */
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'https://www.saucedemo.com/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    /* Setup project — runs auth.setup.js once, saves login session to playwright/.auth/
       Feature tests (inventory, cart etc.) depend on this to skip login UI entirely */
    { name: 'setup', testMatch: /.*\.setup\.js/ },

    {
      name: 'chromium',
      /* Blocked from feature folders — only non-auth tests run here (no storageState) */
      testIgnore: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: {
          width: 1920,
          height: 1080
        },
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        headless: true,
      },
    },

    {
      name: 'firefox',
      /* Blocked from feature folders — same reason as chromium above */
      testIgnore: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
      use: {
        ...devices['Desktop Firefox'],
        viewport: {
          width: 1920,
          height: 1080
        },
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        headless: true,
      },
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },

    /* Authenticated projects for feature tests (inventory, cart, checkout etc.)
       Reuse saved login session from setup — skips login UI entirely. */
    {
      name: 'chromium-authenticated',
      testMatch: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        headless: true,
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox-authenticated',
      testMatch: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        headless: true,
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

