import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { CheckoutPage } from '../../pages/checkout.page.js';
import testdata from '../../testdata/checkout.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2 } = tags;
const { backpack, fleece_jacket } = testdata.products;
const { form, navigation, step_two, pricing, product_prices } = testdata;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user - step two content and pricing */
test.describe('standard_user - checkout step two summary', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage, cartPage, checkoutPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        checkoutPage = new CheckoutPage(page);
        await inventoryPage.goto();
    });

    test('[TC_CHK_12] step two shows correct page label and all summary sections', { tag: [P2, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);

        await expect(page).toHaveURL(new RegExp(navigation.step_two_url));
        await expect(checkoutPage.pageTitle).toHaveText(testdata.page_labels.step_two);
        await expect(checkoutPage.paymentInfoValue).toHaveText(step_two.payment);
        await expect(checkoutPage.shippingInfoValue).toHaveText(step_two.shipping);
        await expect(checkoutPage.subtotalLabel).toBeVisible();
        await expect(checkoutPage.taxLabel).toBeVisible();
        await expect(checkoutPage.totalLabel).toBeVisible();
        await expect(checkoutPage.cancelButton).toBeVisible();
        await expect(checkoutPage.finishButton).toBeVisible();
    });

    test('[TC_CHK_13] step two shows correct item details matching cart', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);

        await expect(page).toHaveURL(new RegExp(navigation.step_two_url));
        await expect(checkoutPage.itemNames.filter({ hasText: backpack })).toBeVisible();
        await expect(checkoutPage.itemNames.filter({ hasText: fleece_jacket })).toBeVisible();
        await expect(checkoutPage.itemPrices.nth(0)).toHaveText(product_prices.backpack);
        await expect(checkoutPage.itemPrices.nth(1)).toHaveText(product_prices.fleece_jacket);
    });

    test('[TC_CHK_14] item total on step two is mathematically accurate', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);

        await expect(checkoutPage.subtotalLabel).toContainText(pricing.backpack_and_fleece.subtotal);
    });

    test('[TC_CHK_15] tax on step two is correct at 8 percent', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);

        await expect(checkoutPage.taxLabel).toContainText(pricing.backpack_and_fleece.tax);
    });

    test('[TC_CHK_16] grand total on step two equals item total plus tax', { tag: [P1, regression] }, async ({ page }) => {
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);

        await expect(checkoutPage.totalLabel).toContainText(pricing.backpack_and_fleece.total);
    });
});

/** visual_user - step two prices correct despite inflated inventory */
test.describe('visual_user - step two uses correct backend prices', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    test('[TC_CHK_17] step two subtotal uses correct backend prices not inflated inventory prices', { tag: [P1, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);

        await expect(page).toHaveURL(new RegExp(navigation.step_two_url));
        await expect(checkoutPage.subtotalLabel).toContainText(pricing.backpack_and_fleece.subtotal);
        await expect(checkoutPage.taxLabel).toContainText(pricing.backpack_and_fleece.tax);
        await expect(checkoutPage.totalLabel).toContainText(pricing.backpack_and_fleece.total);
    });
});

/** error_user - step two accessible despite validation bypass (bug) */
test.describe('error_user - step two reached via validation bypass bug', () => {
    test.use({ storageState: AUTH(ENV.error_user) });

    test('[TC_CHK_18] error_user should not reach step two with empty Last Name', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: validation is bypassed on step one for error_user, allowing step two access
        // with incomplete customer data (empty Last Name)
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();

        // Do not fix any fields - click Continue with empty Last Name
        await checkoutPage.continueButton.click();

        // Should stay on step one - validation should block navigation
        await expect(page).not.toHaveURL(new RegExp(navigation.step_two_url));
    });
});
