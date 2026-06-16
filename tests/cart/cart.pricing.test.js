import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { CheckoutPage } from '../../pages/checkout.page.js';
import testdata from '../../testdata/cart.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2 } = tags;
const { backpack, fleece_jacket } = testdata.test_products;
const { checkout_user, pricing, navigation } = testdata;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user */
test.describe('standard_user - checkout pricing accuracy', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage, cartPage, checkoutPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        checkoutPage = new CheckoutPage(page);
        await inventoryPage.goto();
    });

    test('[TC_CART_18] step two subtotal matches single item price', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(checkout_user);
        await expect(page).toHaveURL(navigation.checkout_step_two_url);
        await expect(checkoutPage.subtotalLabel).toContainText(pricing.backpack_only);
    });

    test('[TC_CART_19] step two subtotal equals sum of all added items', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(checkout_user);
        await expect(page).toHaveURL(navigation.checkout_step_two_url);
        await expect(checkoutPage.subtotalLabel).toContainText(pricing.backpack_and_fleece);
    });

    test('[TC_CART_21] removing item from cart updates step two subtotal', { tag: [P2, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.removeItem(backpack);
        await expect(cartPage.cartItems).toHaveCount(1);
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(checkout_user);
        await expect(page).toHaveURL(navigation.checkout_step_two_url);
        await expect(checkoutPage.subtotalLabel).toContainText(pricing.fleece_jacket_only);
    });
});

/** visual_user - checkout step two shows correct prices despite inflated inventory */
test.describe('visual_user - checkout pricing (correct despite inventory price inflation)', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    test('[TC_CART_20] step two subtotal uses correct backend prices not inflated inventory prices', { tag: [P1, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(checkout_user);
        await expect(page).toHaveURL(navigation.checkout_step_two_url);
        await expect(checkoutPage.subtotalLabel).toContainText(pricing.backpack_and_fleece);
    });
});
