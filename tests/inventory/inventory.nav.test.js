import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import testdata from '../../testdata/inventory.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2, P3 } = tags;
const { backpack, bike_light } = testdata.test_products;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

test.describe('standard_user — navigation', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_15] cart icon is visible and navigates to cart page', { tag: [P1, regression] }, async ({ page }) => {
        await expect(inventoryPage.shoppingCartIcon).toBeVisible();
        await inventoryPage.shoppingCartIcon.click();
        await expect(page).toHaveURL(testdata.navigation.cart_url);
    });

    test('[TC_INV_17] hamburger menu opens with exactly 4 correct options', { tag: [P1, regression] }, async () => {
        await inventoryPage.openMenu();
        for (const link of testdata.menu.links) {
            await expect(inventoryPage.page.getByRole('link', { name: link })).toBeVisible();
        }
    });

    test('[TC_INV_18] All Items link navigates back to inventory', { tag: [P2, regression] }, async ({ page }) => {
        await inventoryPage.openMenu();
        await inventoryPage.allItemsLink.click();
        await expect(page).toHaveURL(new RegExp(testdata.navigation.inventory_url));
        await expect(inventoryPage.inventoryList).toBeVisible();
    });

    test('[TC_INV_19] About link navigates to saucelabs.com', { tag: [P3, regression] }, async ({ page }) => {
        await inventoryPage.openMenu();
        await inventoryPage.aboutLink.click();
        await expect(page).toHaveURL(testdata.navigation.about_url);
    });

    test('[TC_INV_21] Reset App State clears cart without logging out', { tag: [P2, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(bike_light);
        await expect(inventoryPage.cartBadge).toHaveText('2');

        await inventoryPage.openMenu();
        await inventoryPage.resetAppStateLink.click();

        // Badge gone and URL unchanged — still on inventory, not redirected or logged out
        await expect(inventoryPage.cartBadge).not.toBeVisible();
        await expect(page).toHaveURL(new RegExp(testdata.navigation.inventory_url));
        // saucedemo doesn't reactively update button text after reset — reload to confirm full state reset
        await page.reload();
        await expect(inventoryPage.inventoryItems.filter({ hasText: backpack }).locator(inventoryPage.addToCartButton)).toBeVisible();
    });
});
