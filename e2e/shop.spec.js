// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ShopSmart E2E Tests
 * ===================
 * End-to-end tests covering the full user journey:
 *   1. Homepage load & title verification
 *   2. Backend connectivity check
 *   3. Product CRUD lifecycle (Create -> Verify -> Delete -> Verify removal)
 *   4. Flaky test demonstration (simulated timeout)
 */

test.describe('ShopSmart Application', () => {

    // ── Homepage ──────────────────────────────────────────────
    test('should load homepage and display ShopSmart title', async ({ page }) => {
        await page.goto('/');

        // Verify the app title is visible
        await expect(page.locator('h1')).toContainText('ShopSmart');
    });

    // ── Backend Connection ────────────────────────────────────
    test('should show Backend Online status', async ({ page }) => {
        await page.goto('/');

        // Wait for the health check to resolve and show "Backend Online"
        const statusIndicator = page.locator('.status-ok');
        await expect(statusIndicator).toBeVisible({ timeout: 10_000 });
        await expect(statusIndicator).toContainText('Backend Online');
    });

    // ── Product Management Lifecycle ──────────────────────────
    test.describe('Product Management', () => {
        const testProduct = {
            name: `E2E Test Product ${Date.now()}`,
            description: 'Created by Playwright E2E test',
            price: '42.99',
        };

        test('should create a new product and verify it appears', async ({ page }) => {
            await page.goto('/');

            // Wait for the product list to finish loading
            await expect(page.locator('.product-manager')).toBeVisible({ timeout: 10_000 });

            // Fill in the product form
            await page.fill('input[placeholder="Product Name"]', testProduct.name);
            await page.fill('textarea[placeholder="Description (optional)"]', testProduct.description);
            await page.fill('input[placeholder="Price"]', testProduct.price);

            // Submit the form
            await page.click('button:has-text("Add Product")');

            // Verify the new product appears in the list
            const productCard = page.locator('.product-card', { hasText: testProduct.name });
            await expect(productCard).toBeVisible({ timeout: 5_000 });

            // Verify price is displayed correctly
            await expect(productCard.locator('.price')).toContainText('$42.99');
        });

        test('should delete a product and verify it is removed', async ({ page }) => {
            await page.goto('/');

            // Wait for list to load
            await expect(page.locator('.product-manager')).toBeVisible({ timeout: 10_000 });

            // First, create a product to delete
            const deleteTargetName = `Delete Me ${Date.now()}`;
            await page.fill('input[placeholder="Product Name"]', deleteTargetName);
            await page.fill('input[placeholder="Price"]', '1.00');
            await page.click('button:has-text("Add Product")');

            // Wait for the product to appear
            const productCard = page.locator('.product-card', { hasText: deleteTargetName });
            await expect(productCard).toBeVisible({ timeout: 5_000 });

            // Accept the confirmation dialog before clicking delete
            page.on('dialog', async (dialog) => {
                expect(dialog.message()).toContain('Are you sure');
                await dialog.accept();
            });

            // Click the Delete button on the specific product card
            await productCard.locator('button:has-text("Delete")').click();

            // Verify the product is removed from the list
            await expect(productCard).not.toBeVisible({ timeout: 5_000 });
        });
    });

    // ── Form Validation ───────────────────────────────────────
    test('should show Product Management heading', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('.product-manager')).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('h2')).toContainText('Product Management');
        await expect(page.locator('h3').first()).toContainText('Add New Product');
    });
});

// ── Flaky E2E Test Demonstration ──────────────────────────────
test.describe('Flaky E2E Test Demo', () => {
    /**
     * This test simulates flakiness by randomly deciding whether to
     * wait for an element that may or may not exist in time.
     * 
     * Playwright's built-in retry mechanism (configured in playwright.config.js)
     * will automatically re-run this test on failure.
     */
    test('should handle intermittent timing (flaky demo)', async ({ page }) => {
        await page.goto('/');

        // Simulate flakiness: randomly choose a very short or normal timeout
        const isFlaky = Math.random() < 0.3; // ~30% chance of being flaky
        const timeout = isFlaky ? 1 : 10_000; // 1ms vs 10s

        console.log(`  [Flaky E2E] Using timeout: ${timeout}ms (${isFlaky ? 'FLAKY - likely to fail' : 'NORMAL'})`);

        // This will fail with the tiny timeout if the page hasn't loaded yet
        await expect(page.locator('h1')).toContainText('ShopSmart', { timeout });
    });
});
