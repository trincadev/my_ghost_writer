import 'dotenv/config'
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 24 * 1000,
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [ ['html', { open: 'never' }] ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.DOMAIN_PORT ?? 'http://localhost:7860',
    browserName: "chromium",
    viewport: { width: 1600, height: 1200 },
    ignoreHTTPSErrors: true,
    permissions: ['microphone'],
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    launchOptions: {
      ignoreDefaultArgs: ['--mute-audio'],
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
      ],
    }
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
  },

  /* Configure projects for major browsers */
  projects: [
    // { name: 'setup_classic_lite.koboldai.net', testMatch: 'setup-classic-lite.koboldai.net.ts' },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 1200 },
      } //, dependencies: ["setup_classic_lite.koboldai.net"]
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1600, height: 1200 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1600, height: 1200 },
      },
    },
    {
      name: 'responsivePortrait',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 600, height: 1260 },
      }
    },
    {
      name: 'responsiveLandscape',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 2000, height: 600 },
      }
    },

    // Test against mobile viewports.
    {
      name: 'MobileChrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'MobileChromeLandscape',
      use: { ...devices['Pixel 7 landscape'] },
    },
    {
      name: 'MobileSafari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'MobileSafariLandscape',
      // for some reason the 'iPhone 13' viewport is too small.
      // I tried it on a real iPhone 13 and also if there is not too much space for scrolling the results it's possible
      // workaround: emulating a bigger device
      use: { ...devices['iPhone 13 Pro Max landscape'] },
    },

    {
      name: 'iPad (gen 7)',
      use: { ...devices['iPad (gen 7)'] }
    },
    {
      name: 'iPad (gen 7) landscape',
      use: { ...devices['iPad (gen 7) landscape'] }
    },
    {
      name: 'iPad (gen 11)',
      use: { ...devices['iPad (gen 11)'] }
    },
    {
      name: 'iPad (gen 11) landscape',
      use: { ...devices['iPad (gen 11) landscape'] }
    },
    {
      name: 'iPad Mini',
      use: { ...devices['iPad Mini'] }
    },
    {
      name: 'iPad Mini landscape',
      use: { ...devices['iPad Mini landscape'] }
    },
    {
      name: 'iPad Pro 11',
      use: { ...devices['iPad Pro 11'] }
    },
    {
      name: 'iPad Pro 11 landscape',
      use: { ...devices['iPad Pro 11 landscape'] }
    }
    /*
    // Test against branded browsers.
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    }*/
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
    webServer: [
    {
      command: "cd ../lite.koboldai.net && python3 -m http.server",
      url: process.env.DOMAIN_PORT_BACKEND ?? "http://localhost:8000",
      reuseExistingServer: !process.env.CI
    }
  ]
});
