import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { CheckoutPage } from '../../pages/checkout.page.js';
import testdata from '../../testdata/checkout.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1 } = tags;
const { backpack, fleece_jacket } = testdata.products;
const { form, navigation, step_two, pricing, complete } = testdata;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user - full happy path E2E */
test.describe('standard_user - full end-to-end checkout flow', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    test('[TC_CHK_32] complete checkout flow succeeds end to end with correct prices at every step', { tag: [P1, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        // Add both products
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await expect(inventoryPage.cartBadge).toHaveText('1');
        await inventoryPage.addToCartByName(fleece_jacket);
        await expect(inventoryPage.cartBadge).toHaveText('2');

        // Verify cart
        await cartPage.goto();
        await expect(cartPage.cartItems).toHaveCount(2);
        await expect(cartPage.cartItems.filter({ hasText: backpack })).toBeVisible();
        await expect(cartPage.cartItems.filter({ hasText: fleece_jacket })).toBeVisible();

        // Proceed to checkout step one
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
        await checkoutPage.fillStepOne(form.valid);

        // Verify step two prices
        await expect(page).toHaveURL(new RegExp(navigation.step_two_url));
        await expect(checkoutPage.paymentInfoValue).toHaveText(step_two.payment);
        await expect(checkoutPage.shippingInfoValue).toHaveText(step_two.shipping);
        await expect(checkoutPage.subtotalLabel).toContainText(pricing.backpack_and_fleece.subtotal);
        await expect(checkoutPage.taxLabel).toContainText(pricing.backpack_and_fleece.tax);
        await expect(checkoutPage.totalLabel).toContainText(pricing.backpack_and_fleece.total);

        // Finish and verify confirmation
        await checkoutPage.finishButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.complete_url));
        await expect(checkoutPage.completeHeader).toHaveText(complete.heading);
        await expect(inventoryPage.cartBadge).not.toBeVisible();

        // Return home - cart should be empty
        await checkoutPage.backHomeButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.inventory_url));
        await expect(inventoryPage.cartBadge).not.toBeVisible();
        await expect(inventoryPage.addToCartButton).toHaveCount(6);
    });
});
