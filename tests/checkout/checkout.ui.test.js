import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { CheckoutPage } from '../../pages/checkout.page.js';
import testdata from '../../testdata/checkout.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2 } = tags;
const { backpack } = testdata.products;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user - step one layout */
test.describe('standard_user - checkout step one layout', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    test('[TC_CHK_01] checkout step one displays correct layout and elements', { tag: [P2, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();

        await expect(page).toHaveURL(new RegExp(testdata.navigation.step_one_url));
        await expect(checkoutPage.pageTitle).toHaveText(testdata.page_labels.step_one);
        await expect(checkoutPage.firstNameInput).toBeVisible();
        await expect(checkoutPage.firstNameInput).toHaveValue('');
        await expect(checkoutPage.lastNameInput).toBeVisible();
        await expect(checkoutPage.lastNameInput).toHaveValue('');
        await expect(checkoutPage.zipCodeInput).toBeVisible();
        await expect(checkoutPage.zipCodeInput).toHaveValue('');
        await expect(checkoutPage.cancelButton).toBeVisible();
        await expect(checkoutPage.continueButton).toBeVisible();
        await expect(checkoutPage.cartBadge).toHaveText('1');
    });
});

/** visual_user - all 3 fields pre-filled with garbage on load (bug) */
test.describe('visual_user - checkout step one pre-filled fields bug', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    test('[TC_CHK_02] checkout step one fields should be empty on load for visual_user', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: visual_user checkout form pre-fills all 3 fields with 'a' on page load
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();

        await expect(page).toHaveURL(new RegExp(testdata.navigation.step_one_url));
        await expect(checkoutPage.firstNameInput).toHaveValue('');
        await expect(checkoutPage.lastNameInput).toHaveValue('');
        await expect(checkoutPage.zipCodeInput).toHaveValue('');
    });
});

/** error_user - fields pre-filled with garbage, Last Name non-interactive (bug) */
test.describe('error_user - checkout step one pre-filled and non-interactive fields bug', () => {
    test.use({ storageState: AUTH(ENV.error_user) });

    test('[TC_CHK_03] checkout step one fields should be empty and interactive for error_user', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: error_user firstName and zip pre-filled with 'a'; lastName is non-interactive
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();

        await expect(page).toHaveURL(new RegExp(testdata.navigation.step_one_url));
        await expect(checkoutPage.firstNameInput).toHaveValue('');
        await expect(checkoutPage.zipCodeInput).toHaveValue('');
        // Last Name should accept user input
        await checkoutPage.lastNameInput.fill('Test');
        await expect(checkoutPage.lastNameInput).toHaveValue('Test');
    });
});
