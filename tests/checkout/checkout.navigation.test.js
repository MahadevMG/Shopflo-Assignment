import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { CheckoutPage } from '../../pages/checkout.page.js';
import testdata from '../../testdata/checkout.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2 } = tags;
const { backpack, fleece_jacket } = testdata.products;
const { form, navigation } = testdata;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user - step one and step two navigation */
test.describe('standard_user - checkout navigation', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage, cartPage, checkoutPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        checkoutPage = new CheckoutPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
    });

    test('[TC_CHK_10] cancel on step one returns to cart with items intact', { tag: [P1, regression] }, async ({ page }) => {
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
        await checkoutPage.cancelButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.cart_url));
        await expect(cartPage.cartItems).toHaveCount(1);
        await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    test('[TC_CHK_11] valid details on step one proceeds to step two', { tag: [P1, regression] }, async ({ page }) => {
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);
        await expect(page).toHaveURL(new RegExp(navigation.step_two_url));
        await expect(checkoutPage.pageTitle).toHaveText(testdata.page_labels.step_two);
    });

    test('[TC_CHK_20] cancel on step two returns to inventory with cart badge intact', { tag: [P2, regression] }, async ({ page }) => {
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);
        await expect(page).toHaveURL(new RegExp(navigation.step_two_url));
        await checkoutPage.cancelButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.inventory_url));
        await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    test('[TC_CHK_21] clicking Finish completes order and shows confirmation', { tag: [P1, regression] }, async ({ page }) => {
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);
        await checkoutPage.finishButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.complete_url));
        await expect(checkoutPage.completeHeader).toHaveText(testdata.complete.heading);
        await expect(inventoryPage.cartBadge).not.toBeVisible();
    });

    test('[TC_CHK_26] Back Home button on confirmation returns to inventory', { tag: [P2, regression] }, async ({ page }) => {
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);
        await checkoutPage.finishButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.complete_url));
        await checkoutPage.backHomeButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.inventory_url));
    });
});

/** error_user - Finish button non-interactive (bug) */
test.describe('error_user - Finish button non-interactive bug', () => {
    test.use({ storageState: AUTH(ENV.error_user) });

    test('[TC_CHK_19] Finish button should complete order but is non-interactive for error_user', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: Finish button does not respond to clicks for error_user
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        // error_user bypasses validation on step one (TC_CHK_09 bug)
        await checkoutPage.continueButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.step_two_url));

        await checkoutPage.finishButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.complete_url), { timeout: 5000 });
    });
});
