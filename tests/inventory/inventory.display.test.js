import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import testdata from '../../testdata/inventory.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1 } = tags;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/**  standard_user */
test.describe('standard_user — product display', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    
    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_06] header shows Swag Labs correctly', { tag: [P1, regression] }, async () => {
        await expect(inventoryPage.appLogo).toBeVisible();
        await expect(inventoryPage.appLogo).toHaveText(testdata.page_labels.header);
    });

    test('[TC_INV_07] Products label is visible below the hamburger menu', { tag: [P1, regression] }, async () => {
        await expect(inventoryPage.productPageTitle).toBeVisible();
        await expect(inventoryPage.productPageTitle).toHaveText(testdata.page_labels.inventory_title);
    });

    test('[TC_INV_01] all 6 products load with name, price, image and Add to cart button', { tag: [P1, regression] }, async () => {
        await expect(inventoryPage.inventoryItems).toHaveCount(6);

        for (const product of testdata.products) {
            const card = inventoryPage.inventoryItems.filter({ hasText: product.name });
            await expect(card).toBeVisible();
            await expect(card.locator(inventoryPage.itemPrices)).toHaveText(product.price);
            await expect(card.locator(inventoryPage.addToCartButton)).toBeVisible();
            await expect(card.locator(inventoryPage.itemImages)).toBeVisible();
        }
    });

    test('[TC_INV_40] all 6 product images load without broken icons', { tag: [P1, regression] }, async () => {
        await expect(inventoryPage.itemImages).toHaveCount(6);

        const images = await inventoryPage.itemImages.all();
        for (const img of images) {
            const src = await img.getAttribute('src');
            expect(src).toBeTruthy();
            expect(src).not.toContain('undefined');
        }
    });
});

/** problem_user */
test.describe('problem_user — product display (known image bug)', () => {
    test.use({ storageState: AUTH(ENV.problem_user) });

    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_02] all 6 products load but every image is the same wrong dog photo', { tag: [P1, regression] }, async () => {
        // Bug: all product images replaced with the same dog photo — asset URL mapping broken for problem_user
        await expect(inventoryPage.inventoryItems).toHaveCount(6);

        const images = await inventoryPage.itemImages.all();
        const srcs = await Promise.all(images.map(img => img.getAttribute('src')));
        const uniqueSrcs = new Set(srcs);
        expect(uniqueSrcs.size).toBe(1);
    });

    test('[TC_INV_41] none of the 6 product images match their actual product', { tag: [P1, regression] }, async () => {
        // Bug: no product-specific image loads — all show the same dog photo
        const images = await inventoryPage.itemImages.all();
        for (const img of images) {
            const src = await img.getAttribute('src');
            expect(src).not.toMatch(/sauce-labs-back|sauce-labs-bike|sauce-labs-bolt|sauce-labs-fleece|sauce-labs-onesie|red-onesie/);
        }
    });
});

/**  visual_user */
test.describe('visual_user — product display (known price and image bugs)', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_03] all 6 products load but prices are inflated and wrong', { tag: [P1, regression] }, async () => {
        // Bug: all prices are wrong for visual_user — none match standard_user prices
        await expect(inventoryPage.inventoryItems).toHaveCount(6);

        const prices = await inventoryPage.getAllProductPrices();
        const standardPrices = testdata.products.map(p => p.price);
        const allMatch = prices.every(p => standardPrices.includes(p));
        expect(allMatch).toBe(false);
    });

    test('[TC_INV_42] backpack card shows wrong image, other 5 load correctly', { tag: [P1, regression] }, async () => {
        // Bug: only Sauce Labs Backpack has wrong image for visual_user
        const backpackCard = inventoryPage.inventoryItems.filter({ hasText: testdata.test_products.backpack });
        const src = await backpackCard.locator(inventoryPage.itemImages).getAttribute('src');
        expect(src).not.toMatch(/sauce-labs-back/);
    });
});

/** performance_glitch_user */
test.describe('performance_glitch_user — product display (5s load delay)', () => {
    test.use({ storageState: AUTH(ENV.performance_glitch_user) });

    test('[TC_INV_04] inventory loads correctly but takes ~5 seconds', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: artificial ~5s delay injected on login. Content is correct once loaded.
        const inventoryPage = new InventoryPage(page);
        const start = Date.now();
        await inventoryPage.goto();
        await expect(inventoryPage.inventoryItems).toHaveCount(6);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThan(4000);
    });
});

/**  error_user */
test.describe('error_user — product display (page looks correct on load)', () => {
    test.use({ storageState: AUTH(ENV.error_user) });

    test('[TC_INV_05] all 6 products load with correct images and prices', { tag: [P1, regression] }, async ({ page }) => {
        // Errors only surface on interaction (Add to cart) — page looks identical to standard_user on load
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();

        await expect(inventoryPage.inventoryItems).toHaveCount(6);
        for (const product of testdata.products) {
            const card = inventoryPage.inventoryItems.filter({ hasText: product.name });
            await expect(card.locator(inventoryPage.itemPrices)).toHaveText(product.price);
        }
    });
});
