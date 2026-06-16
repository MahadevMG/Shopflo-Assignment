import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage } from '../../pages/cart.page.js';
import testdata from '../../testdata/cart.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1, P2, P3 } = tags;
const { backpack, fleece_jacket } = testdata.test_products;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/** standard_user */
test.describe('standard_user - cart page layout', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage, cartPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await inventoryPage.addToCartByName(fleece_jacket);
        await cartPage.goto();
    });

    test('[TC_CART_02] cart page shows correct header label, column headers and action buttons', { tag: [P2, regression] }, async () => {
        await expect(cartPage.pageTitle).toHaveText(testdata.page_labels.title);
        await expect(cartPage.qtyLabel).toHaveText(testdata.page_labels.qty_column);
        await expect(cartPage.descLabel).toHaveText(testdata.page_labels.description_column);
        await expect(cartPage.continueShopping).toBeVisible();
        await expect(cartPage.checkoutButton).toBeVisible();
    });

    test('[TC_CART_17] cart does not provide quantity stepper - QTY is fixed at 1', { tag: [P3, regression] }, async () => {
        // Missing feature: no +/- stepper or editable qty input - user must return to inventory to add more
        const qty = await cartPage.itemQuantities.first().textContent();
        expect(qty.trim()).toBe('1');
        await expect(cartPage.page.getByRole('spinbutton')).toHaveCount(0);
    });
});

/** visual_user - Checkout button mispositioned (known bug) */
test.describe('visual_user - cart layout (known Checkout button position bug)', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    let inventoryPage, cartPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        cartPage = new CartPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(backpack);
        await cartPage.goto();
    });

    test('[TC_CART_03] Checkout button should be in cart footer but is displaced to header for visual_user', { tag: [P1, regression] }, async () => {
        // Bug: Checkout button floats into the top-right header area instead of sitting at bottom-right
        await expect(cartPage.cartFooter.locator(cartPage.checkoutButton)).toBeVisible();
    });
});
