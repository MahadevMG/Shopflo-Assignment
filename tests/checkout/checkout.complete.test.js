import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import { CheckoutPage } from '../../pages/checkout.page.js';
import testdata from '../../testdata/checkout.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2, P3 } = tags;
const { backpack, fleece_jacket } = testdata.products;
const { form, navigation, complete, correct_inventory_prices } = testdata;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user - confirmation page */
test.describe('standard_user - checkout complete page', () => {
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
        await checkoutPage.fillStepOne(form.valid);
        await checkoutPage.finishButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.complete_url));
    });

    test('[TC_CHK_22] checkout complete page displays all required confirmation elements', { tag: [P1, regression] }, async ({ page }) => {
        await expect(checkoutPage.pageTitle).toHaveText(testdata.page_labels.complete);
        await expect(checkoutPage.ponyImage).toBeVisible();
        await expect(checkoutPage.completeHeader).toHaveText(complete.heading);
        await expect(checkoutPage.completeText).toHaveText(complete.subtext);
        await expect(checkoutPage.backHomeButton).toBeVisible();
        await expect(inventoryPage.cartBadge).not.toBeVisible();
    });

    test('[TC_CHK_23] cart is cleared after successful checkout', { tag: [P1, regression] }, async ({ page }) => {
        await expect(inventoryPage.cartBadge).not.toBeVisible();
        await checkoutPage.backHomeButton.click();
        await expect(page).toHaveURL(new RegExp(navigation.inventory_url));
        await expect(inventoryPage.cartBadge).not.toBeVisible();
        await expect(inventoryPage.addToCartButton).toHaveCount(6);
    });

    test('[TC_CHK_27] checkout complete page is missing order number and email confirmation', { tag: [P3, regression] }, async ({ page }) => {
        // UX Gap: a real checkout platform should show an order number and email confirmation
        // Bug: SauceDemo shows no order reference number - customer cannot track their purchase
        await expect(page.getByText(/order.*#|order.*number|confirmation.*number/i)).toBeVisible();
    });
});

/** visual_user - confirmation page and post-checkout inventory prices */
test.describe('visual_user - checkout complete and inventory price randomization', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    test('[TC_CHK_24] checkout complete page displays correctly for visual_user', { tag: [P1, regression] }, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);
        await checkoutPage.finishButton.click();

        await expect(page).toHaveURL(new RegExp(navigation.complete_url));
        await expect(checkoutPage.pageTitle).toHaveText(testdata.page_labels.complete);
        await expect(checkoutPage.completeHeader).toHaveText(complete.heading);
        await expect(checkoutPage.completeText).toHaveText(complete.subtext);
        await expect(checkoutPage.backHomeButton).toBeVisible();
    });

    test('[TC_CHK_25] returning to inventory after checkout shows correct prices for visual_user', { tag: [P1, regression] }, async ({ page }) => {
        // Bug: prices are randomized on every inventory page load for visual_user
        // After checkout, prices should reset to correct values but instead show new random wrong values
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
        await cartPage.checkoutButton.click();
        await checkoutPage.fillStepOne(form.valid);
        await checkoutPage.finishButton.click();
        await checkoutPage.backHomeButton.click();

        await expect(page).toHaveURL(new RegExp(navigation.inventory_url));
        // Prices should be correct after returning home
        const prices = await inventoryPage.getAllProductPrices();
        const expectedPrices = Object.values(correct_inventory_prices);
        const allCorrect = prices.every(p => expectedPrices.includes(p));
        expect(allCorrect, 'All inventory prices should show correct values after checkout').toBe(true);
    });
});
