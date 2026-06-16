import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { LoginPage } from '../../pages/login.page.js';
import testdata from '../../testdata/cart.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2, P3 } = tags;
const { backpack, fleece_jacket, bike_light } = testdata.test_products;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user */
test.describe('standard_user - cart navigation', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage, cartPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        await inventoryPage.goto();
    });

    test('[TC_CART_12] Continue Shopping returns to inventory with cart intact', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.continueShopping.click();
        await expect(page).toHaveURL(testdata.navigation.inventory_url);
        await expect(inventoryPage.inventoryList).toBeVisible();
        await expect(inventoryPage.cartBadge).toHaveText('2');
    });

    test('[TC_CART_13] Checkout button navigates to checkout step one', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(testdata.navigation.checkout_step_one_url);
    });

    test('[TC_CART_15] cart items persist after navigating away and back within same session', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.itemNames.filter({ hasText: backpack }).click();
        await page.goBack();
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(1);
        await expect(cartPage.cartItems.filter({ hasText: backpack })).toBeVisible();
    });

    test('[TC_CART_16] cart is cleared after logout and re-login - items are lost', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: cart state stored in localStorage is wiped on session end
        // Expected: both items persist after logout/re-login
        const loginPage = new LoginPage(page);
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await expect(inventoryPage.cartBadge).toHaveText('2');
        await inventoryPage.logout();
        await loginPage.login(ENV.standard_user, ENV.password);
        await expect(page).toHaveURL(new RegExp(testdata.navigation.inventory_url));
        await expect(inventoryPage.cartBadge).toBeVisible();
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(2);
    });

    test('[TC_CART_22] empty cart does not block checkout - no warning shown', { tag: [P3, regression] }, async ({ page }) => {
        // Bug: Checkout button is active even with empty cart - user reaches checkout-step-one with nothing to buy
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(0);
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(testdata.navigation.checkout_step_one_url);
    });
});

/** visual_user - Checkout button navigates despite wrong position */
test.describe('visual_user - cart navigation (Checkout button position bug)', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    test('[TC_CART_14] Checkout button navigates to step one despite being mispositioned in header', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: button is in header not cart footer - but clicking it still navigates correctly
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(testdata.navigation.checkout_step_one_url);
    });
});
