import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { CheckoutPage } from '../../pages/checkout.page.js';
import testdata from '../../testdata/checkout.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1 } = tags;
const { backpack } = testdata.products;
const { form, errors, navigation } = testdata;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user - form validation */
test.describe('standard_user - checkout form validation', () => {
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

    test('[TC_CHK_04] empty form submission is blocked with correct error', { tag: [P1, regression] }, async ({ page }) => {
        await checkoutPage.continueButton.click();
        await expect(checkoutPage.errorMessage).toContainText(errors.first_name_required);
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
    });

    test('[TC_CHK_05] missing First Name shows correct error', { tag: [P1, regression] }, async ({ page }) => {
        await checkoutPage.lastNameInput.fill(form.no_first_name.lastName);
        await checkoutPage.zipCodeInput.fill(form.no_first_name.zip);
        await checkoutPage.continueButton.click();
        await expect(checkoutPage.errorMessage).toContainText(errors.first_name_required);
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
        await expect(checkoutPage.lastNameInput).toHaveValue(form.no_first_name.lastName);
        await expect(checkoutPage.zipCodeInput).toHaveValue(form.no_first_name.zip);
    });

    test('[TC_CHK_06] missing Last Name shows correct error', { tag: [P1, regression] }, async ({ page }) => {
        await checkoutPage.firstNameInput.fill(form.no_last_name.firstName);
        await checkoutPage.zipCodeInput.fill(form.no_last_name.zip);
        await checkoutPage.continueButton.click();
        await expect(checkoutPage.errorMessage).toContainText(errors.last_name_required);
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
        await expect(checkoutPage.firstNameInput).toHaveValue(form.no_last_name.firstName);
        await expect(checkoutPage.zipCodeInput).toHaveValue(form.no_last_name.zip);
    });

    test('[TC_CHK_07] missing Zip Code shows correct error', { tag: [P1, regression] }, async ({ page }) => {
        await checkoutPage.firstNameInput.fill(form.no_zip.firstName);
        await checkoutPage.lastNameInput.fill(form.no_zip.lastName);
        await checkoutPage.continueButton.click();
        await expect(checkoutPage.errorMessage).toContainText(errors.postal_code_required);
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
    });
});

/** visual_user - validation still works when fields are manually cleared */
test.describe('visual_user - checkout validation after clearing pre-filled fields', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    test('[TC_CHK_08] empty form submission after clearing shows correct error for visual_user', { tag: [P1, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();

        await checkoutPage.clearStepOne();
        await checkoutPage.continueButton.click();
        await expect(checkoutPage.errorMessage).toContainText(errors.first_name_required);
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
    });
});

/** error_user - validation bypassed for empty Last Name (bug) */
test.describe('error_user - checkout validation bypass bug', () => {
    test.use({ storageState: AUTH(ENV.error_user) });

    test('[TC_CHK_09] continuing with empty Last Name should be blocked but validation is bypassed for error_user', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: error_user Last Name is empty and non-interactive, but Continue is not blocked
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();

        // Fill First Name and Zip - Last Name is non-interactive and stays empty
        await checkoutPage.firstNameInput.fill('John');
        await checkoutPage.zipCodeInput.fill('10001');
        await checkoutPage.continueButton.click();
        // Should block navigation and show Last Name required error
        await expect(checkoutPage.errorMessage).toContainText(errors.last_name_required);
        await expect(page).toHaveURL(new RegExp(navigation.step_one_url));
    });
});
