// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E Test Configuration for ShopSmart
 *
 * Runs against a local dev environment:
 *   - Server on port 5001
 *   - Client on port 5173
 *
 * Retries are configured to handle flaky tests gracefully.
 */
module.exports = defineConfig({
    testDir: './e2e',
    testMatch: '**/*.spec.js',

    /* Maximum time one test can run */
    timeout: 30_000,

    /* Fail the build after the first test failure in CI */
    fullyParallel: true,

    /* Retry failed tests — key for flaky test resilience */
    retries: process.env.CI ? 2 : 1,

    /* Limit workers in CI to avoid resource contention */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter configuration */
    reporter: process.env.CI
        ? [['html', { open: 'never' }], ['github']]
        : [['html', { open: 'on-failure' }]],

    /* Shared settings for all projects */
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    /* Browser projects */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Start both server and client before running tests */
    webServer: [
        {
            command: 'npm run dev',
            cwd: './server',
            port: 5001,
            reuseExistingServer: !process.env.CI,
            env: {
                DATABASE_URL: 'file:./test-e2e.db',
            },
        },
        {
            command: 'npm run dev',
            cwd: './client',
            port: 5173,
            reuseExistingServer: !process.env.CI,
        },
    ],
});
