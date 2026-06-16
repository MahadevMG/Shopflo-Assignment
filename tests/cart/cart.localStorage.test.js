import { test, expect, chromium } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { LoginPage } from '../../pages/login.page.js';
import testdata from '../../testdata/cart.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1 } = tags;
const { backpack } = testdata.test_products;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

test.describe('cart - localStorage persistence (security)', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    test('[TC_CART_01] cart data should not persist in localStorage after logout', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: saucedemo stores cart in localStorage without clearing it on logout
        // Items added as standard_user survive the session and are visible after re-login
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const loginPage = new LoginPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await expect(inventoryPage.cartBadge).toHaveText('1');

        await inventoryPage.logout();

        // After logout, localStorage should not contain cart data from the previous session
        const cartKey = await page.evaluate((user) => {
            return Object.keys(localStorage).find(k => k.includes(user) || k.includes('cart'));
        }, ENV.standard_user);
        expect(cartKey, 'localStorage should not retain cart data after logout').toBeUndefined();
    });
});

test.describe('cart - localStorage data leaks across users on same browser', () => {

    test('[TC_CART_01b] cart data from one user should not be visible to a different user on same browser', { tag: [P1, regression] }, async ({ browser }) => {
        // Bug: localStorage is not cleared on logout - a second user on the same machine
        // inherits the cart contents of the previous session
        const context = await browser.newContext();
        const page = await context.newPage();

        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const loginPage = new LoginPage(page);

        // Login as standard_user, add item
        await loginPage.goto();
        await loginPage.login(ENV.standard_user, ENV.password);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await expect(inventoryPage.cartBadge).toHaveText('1');

        // Logout
        await inventoryPage.logout();

        // Re-login as performance_glitch_user - should see an empty cart
        await loginPage.login(ENV.performance_glitch_user, ENV.password);
        await expect(page).toHaveURL(new RegExp(testdata.navigation.inventory_url));
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(0);

        await context.close();
    });
});
