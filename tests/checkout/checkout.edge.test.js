import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { CheckoutPage } from '../../pages/checkout.page.js';
import testdata from '../../testdata/checkout.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P3 } = tags;
const { backpack } = testdata.products;
const { form, navigation } = testdata;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user - input format validation gaps */
test.describe('standard_user - checkout input validation gaps', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage, cartPage, checkoutPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        checkoutPage = new CheckoutPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
    });

    test('[TC_CHK_28] checkout form should reject special characters in name fields', { tag: [P3, regression] }, async ({ page }) => {
        // Bug: no input format validation - special characters accepted in all fields
        await checkoutPage.firstNameInput.fill(form.special_chars.firstName);
        await checkoutPage.lastNameInput.fill(form.special_chars.lastName);
        await checkoutPage.zipCodeInput.fill(form.special_chars.zip);
        await checkoutPage.continueButton.click();
        // Should show a validation error for invalid name format
        await expect(checkoutPage.errorMessage).toBeVisible();
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
    });

    test('[TC_CHK_29] zip code field should reject non-numeric input', { tag: [P3, regression] }, async ({ page }) => {
        // Bug: no zip format validation - letters accepted as postal code
        await checkoutPage.firstNameInput.fill(form.invalid_zip.firstName);
        await checkoutPage.lastNameInput.fill(form.invalid_zip.lastName);
        await checkoutPage.zipCodeInput.fill(form.invalid_zip.zip);
        await checkoutPage.continueButton.click();
        // Should show a validation error for invalid zip format
        await expect(checkoutPage.errorMessage).toBeVisible();
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
    });
});
