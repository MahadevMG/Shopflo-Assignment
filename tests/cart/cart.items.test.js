import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import testdata from '../../testdata/cart.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2 } = tags;
const { backpack, fleece_jacket, bike_light, bolt_tshirt } = testdata.test_products;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user */
test.describe('standard_user - cart items', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage, cartPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        await inventoryPage.goto();
    });

    test('[TC_CART_04] single product added from inventory appears correctly in cart', { tag: [P1, regression] }, async () => {
        await inventoryPage.addToCartByName(backpack);
        await expect(inventoryPage.cartBadge).toHaveText('1');
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(1);
        await expect(cartPage.itemNames).toHaveText(backpack);
        await expect(cartPage.itemPrices).toHaveText(testdata.product_prices.backpack);
        await expect(cartPage.itemQuantities).toHaveText('1');
        await expect(cartPage.cartItems.locator(cartPage.removeButton)).toBeVisible();
    });

    test('[TC_CART_05] product details in cart exactly match what was shown on inventory', { tag: [P1, regression] }, async () => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        const backpackRow = cartPage.cartItems.filter({ hasText: backpack });
        const fleeceRow = cartPage.cartItems.filter({ hasText: fleece_jacket });
        await expect(backpackRow.locator(cartPage.itemPrices)).toHaveText(testdata.product_prices.backpack);
        await expect(fleeceRow.locator(cartPage.itemPrices)).toHaveText(testdata.product_prices.fleece_jacket);
    });

    test('[TC_CART_07] multiple products all appear correctly in cart', { tag: [P1, regression] }, async () => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await expect(inventoryPage.cartBadge).toHaveText('2');
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(2);
        await expect(cartPage.cartItems.filter({ hasText: backpack })).toBeVisible();
        await expect(cartPage.cartItems.filter({ hasText: fleece_jacket })).toBeVisible();
    });

    test('[TC_CART_08] cart badge count always matches actual item rows in cart', { tag: [P1, regression] }, async () => {
        await inventoryPage.addToCartByName(backpack);
        await expect(inventoryPage.cartBadge).toHaveText('1');
        await inventoryPage.addToCartByName(fleece_jacket);
        await expect(inventoryPage.cartBadge).toHaveText('2');
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(2);
    });

    test('[TC_CART_10] Remove button deletes item and badge decrements', { tag: [P1, regression] }, async () => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.removeItem(backpack);
        await expect(cartPage.cartItems).toHaveCount(1);
        await expect(cartPage.cartItems.filter({ hasText: fleece_jacket })).toBeVisible();
        await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    test('[TC_CART_11] removing last item leaves cart empty with buttons still visible', { tag: [P2, regression] }, async () => {
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.removeItem(backpack);
        await expect(cartPage.cartItems).toHaveCount(0);
        await expect(inventoryPage.cartBadge).not.toBeVisible();
        await expect(cartPage.continueShopping).toBeVisible();
        await expect(cartPage.checkoutButton).toBeVisible();
    });
});

/** visual_user - prices in cart correct despite inflated inventory prices */
test.describe('visual_user - cart item prices (correct despite inventory inflation)', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    test('[TC_CART_06] cart shows correct backend prices even though inventory shows inflated prices', { tag: [P1, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await expect(cartPage.cartItems.filter({ hasText: backpack }).locator(cartPage.itemPrices)).toHaveText(testdata.product_prices.backpack);
        await expect(cartPage.cartItems.filter({ hasText: fleece_jacket }).locator(cartPage.itemPrices)).toHaveText(testdata.product_prices.fleece_jacket);
    });
});

/** error_user - items appear in cart despite silent add-to-cart failures */
test.describe('error_user - cart items (silent failure bug)', () => {
    test.use({ storageState: AUTH(ENV.error_user) });

    test('[TC_CART_09] items appear in cart even though badge and button never updated on inventory', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: add to cart fails silently on inventory (badge/button don't update for some products)
        // but items still land in cart - silent UI failure, not a silent functional failure
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(2);
        await expect(cartPage.cartItems.filter({ hasText: backpack })).toBeVisible();
        await expect(cartPage.cartItems.filter({ hasText: fleece_jacket })).toBeVisible();
    });
});

/** problem_user - cart shows correct details despite image bug on inventory */
test.describe('problem_user - cart items (correct despite image bug)', () => {
    test.use({ storageState: AUTH(ENV.problem_user) });

    test('[TC_CART_30] cart displays correct product names descriptions and prices for problem_user', { tag: [P1, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(2);
        await expect(cartPage.cartItems.filter({ hasText: backpack }).locator(cartPage.itemPrices)).toHaveText(testdata.product_prices.backpack);
        await expect(cartPage.cartItems.filter({ hasText: fleece_jacket }).locator(cartPage.itemPrices)).toHaveText(testdata.product_prices.fleece_jacket);
    });
});
