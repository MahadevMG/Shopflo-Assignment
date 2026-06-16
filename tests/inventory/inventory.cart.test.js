import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import testdata from '../../testdata/inventory.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1 } = tags;
const { backpack, bike_light, bolt_tshirt } = testdata.test_products;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/**standard_user */
test.describe('standard_user - cart interactions', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: AUTH(ENV.standard_user) });
        const page = await context.newPage();
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test.afterAll(async () => {
        await inventoryPage.page.context().close();
    });

    test('[TC_INV_26] Add to cart button flips to Remove and badge shows 1', { tag: [P1, regression] }, async () => {
        await inventoryPage.addToCartByName(bolt_tshirt);
        await expect(inventoryPage.inventoryItems.filter({ hasText: bolt_tshirt }).locator(inventoryPage.removeFromCartButton)).toBeVisible();
        await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    test('[TC_INV_29] cart badge increments correctly as more products are added', { tag: [P1, regression] }, async () => {
        await inventoryPage.addToCartByName(backpack);
        await expect(inventoryPage.cartBadge).toHaveText('2');

        await inventoryPage.addToCartByName(bike_light);
        await expect(inventoryPage.cartBadge).toHaveText('3');
    });

    test('[TC_INV_31] Remove button decrements badge count', { tag: [P1, regression] }, async () => {
        await inventoryPage.removeByName(backpack);
        await expect(inventoryPage.cartBadge).toHaveText('2');
        await expect(inventoryPage.inventoryItems.filter({ hasText: backpack }).locator(inventoryPage.addToCartButton)).toBeVisible();
    });
});

/** visual_user - Add to cart works correctly */
test.describe('visual_user - cart interactions (add to cart works despite visual bugs)', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    test('[TC_INV_28] Add to cart button flips to Remove and badge shows 1', { tag: [P1, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(bolt_tshirt);
        await expect(inventoryPage.inventoryItems.filter({ hasText: bolt_tshirt }).locator(inventoryPage.removeFromCartButton)).toBeVisible();
        await expect(inventoryPage.cartBadge).toHaveText('1');
    });
});

/**  error_user - Add to cart fails silently (known bug) */
test.describe('error_user - cart interactions (known silent failure bug)', () => {
    test.use({ storageState: AUTH(ENV.error_user) });

    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_27] Add to cart button does not flip to Remove for error_user', { tag: [P1, regression] }, async () => {
        // Bug: Add to cart action fails silently - button stays as "Add to cart", badge never appears
        await inventoryPage.addToCartByName(bolt_tshirt);
        await expect(inventoryPage.inventoryItems.filter({ hasText: bolt_tshirt }).locator(inventoryPage.removeFromCartButton)).toBeVisible();
        await expect(inventoryPage.cartBadge).toBeVisible();
    });

    test('[TC_INV_30] cart badge never increments for error_user', { tag: [P1, regression] }, async () => {
        // Bug: badge remains empty after every add attempt
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(bike_light);
        await expect(inventoryPage.cartBadge).toBeVisible();
    });
});
