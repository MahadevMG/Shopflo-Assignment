import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { LoginPage } from '../../pages/login.page.js';
import testdata from '../../testdata/inventory.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2 } = tags;
const { backpack } = testdata.test_products;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user */
test.describe('standard_user - product links', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_22] clicking product name opens correct detail page', { tag: [P2, regression] }, async ({ page }) => {
        await inventoryPage.itemNames.filter({ hasText: backpack }).click();
        await expect(page).toHaveURL(testdata.navigation.backpack_detail_url);
    });

    test('[TC_INV_24] clicking product image opens correct detail page', { tag: [P2, regression] }, async ({ page }) => {
        await inventoryPage.inventoryItems
            .filter({ hasText: backpack })
            .locator(inventoryPage.itemImages)
            .click();
        await expect(page).toHaveURL(testdata.navigation.backpack_detail_url);
    });

    test('[TC_INV_51] no broken links - all product names navigate to real pages', { tag: [P2, regression] }, async ({ page }) => {
        const names = await inventoryPage.itemNames.allTextContents();
        for (const name of names) {
            await inventoryPage.goto();
            await inventoryPage.itemNames.filter({ hasText: name }).click();
            await expect(page).toHaveURL(new RegExp(testdata.navigation.product_detail_url));
            await expect(page).not.toHaveURL(/404/);
        }
    });
});

/** problem_user - image links may go to wrong detail page (known bug) */
test.describe('problem_user - product links (known image link bug)', () => {
    test.use({ storageState: AUTH(ENV.problem_user) });

    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_23] clicking product name navigates to correct detail page despite wrong image', { tag: [P2, regression] }, async ({ page }) => {
        await inventoryPage.itemNames.filter({ hasText: backpack }).click();
        await expect(page).toHaveURL(testdata.navigation.backpack_detail_url);
    });

    test('[TC_INV_25] clicking product image may navigate to wrong detail page', { tag: [P2, regression] }, async ({ page }) => {
        // Bug: image links are mismatched for problem_user - dog image on Backpack card may go to wrong product
        await inventoryPage.inventoryItems
            .filter({ hasText: backpack })
            .locator(inventoryPage.itemImages)
            .click();
        await expect(page).toHaveURL(testdata.navigation.backpack_detail_url);
    });

    test('[TC_INV_52] each product image navigates to its own correct detail page', { tag: [P2, regression] }, async ({ page }) => {
        // Bug: image links are mismatched - verify each image goes to the right product URL
        for (const product of testdata.products) {
            await inventoryPage.goto();
            await inventoryPage.inventoryItems
                .filter({ hasText: product.name })
                .locator(inventoryPage.itemImages)
                .click();
            await expect(page).toHaveURL(`${testdata.navigation.product_detail_url}?id=${product.id}`);
        }
    });
});

/** No session - direct URL access blocked */
test.describe('unauthenticated - direct URL access is blocked', () => {
    test('[TC_INV_53] accessing /inventory.html without login redirects to login page', { tag: [P1, regression] }, async ({ page }) => {
        const loginPage = new LoginPage(page);
        await page.goto(testdata.navigation.inventory_url);
        await expect(page).toHaveURL(testdata.navigation.login_url);
        await expect(loginPage.errorMessage).toHaveText(testdata.errors.no_session);
    });
});
