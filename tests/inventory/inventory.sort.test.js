import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import testdata from '../../testdata/inventory.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P2 } = tags;
const AUTH = (/** @type {string} */ user) => `playwright/.auth/${user}.json`;

/**standard_user */
test.describe('standard_user — sort', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_08] sort dropdown defaults to Name (A to Z) on page load', { tag: [P2, regression] }, async () => {
        const selected = await inventoryPage.sortDropdown.inputValue();
        expect(selected).toBe(testdata.sort.name_az.value);
        const firstName = await inventoryPage.itemNames.first().textContent();
        expect(firstName).toBe(testdata.sort.name_az.first);
    });

    test('[TC_INV_09] sort by Name A to Z orders products alphabetically', { tag: [P2, regression] }, async () => {
        const { value, first, last } = testdata.sort.name_az;
        await inventoryPage.sortBy(value);
        expect(await inventoryPage.itemNames.first().textContent()).toBe(first);
        expect(await inventoryPage.itemNames.last().textContent()).toBe(last);
    });

    test('[TC_INV_10] sort by Name Z to A reverses the product order', { tag: [P2, regression] }, async () => {
        const { value, first, last } = testdata.sort.name_za;
        await inventoryPage.sortBy(value);
        expect(await inventoryPage.itemNames.first().textContent()).toBe(first);
        expect(await inventoryPage.itemNames.last().textContent()).toBe(last);
    });

    test('[TC_INV_11] sort by Price low to high puts cheapest product first', { tag: [P2, regression] }, async () => {
        const { value, first, first_price, last, last_price } = testdata.sort.price_low_high;
        await inventoryPage.sortBy(value);
        expect(await inventoryPage.itemNames.first().textContent()).toBe(first);
        expect(await inventoryPage.itemPrices.first().textContent()).toBe(first_price);
        expect(await inventoryPage.itemNames.last().textContent()).toBe(last);
        expect(await inventoryPage.itemPrices.last().textContent()).toBe(last_price);
    });

    test('[TC_INV_13] sort by Price high to low puts most expensive product first', { tag: [P2, regression] }, async () => {
        const { value, first, first_price, last, last_price } = testdata.sort.price_high_low;
        await inventoryPage.sortBy(value);
        expect(await inventoryPage.itemNames.first().textContent()).toBe(first);
        expect(await inventoryPage.itemPrices.first().textContent()).toBe(first_price);
        expect(await inventoryPage.itemNames.last().textContent()).toBe(last);
        expect(await inventoryPage.itemPrices.last().textContent()).toBe(last_price);
    });

    test('[TC_INV_54] switching between all 4 sort options updates the product order each time', { tag: [P2, regression] }, async () => {
        const options = [testdata.sort.name_az, testdata.sort.name_za, testdata.sort.price_low_high, testdata.sort.price_high_low];
        for (const option of options) {
            await inventoryPage.sortBy(option.value);
            expect(await inventoryPage.itemNames.first().textContent()).toBe(option.first);
        }
    });

    test('[TC_INV_56] top-left product position changes to reflect active sort', { tag: [P2, regression] }, async () => {
        expect(await inventoryPage.itemNames.first().textContent()).toBe(testdata.sort.name_az.first);
        await inventoryPage.sortBy(testdata.sort.price_low_high.value);
        expect(await inventoryPage.itemNames.first().textContent()).toBe(testdata.sort.price_low_high.first);
    });
});

/** visual_user — price sort shows wrong prices (known bug) */
test.describe('visual_user — sort (known price display bug)', () => {
    test.use({ storageState: AUTH(ENV.visual_user) });

    let inventoryPage;
    test.beforeEach(async ({ page }) => {
        inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
    });

    test('[TC_INV_12] sort Price low to high — displayed prices are all wrong', { tag: [P2, regression] }, async () => {
        // Bug: sort may reorder items but all prices shown are inflated/incorrect for visual_user
        await inventoryPage.sortBy(testdata.sort.price_low_high.value);
        const firstPrice = await inventoryPage.itemPrices.first().textContent();
        expect(firstPrice).toBe(testdata.sort.price_low_high.first_price);
    });

    test('[TC_INV_14] sort Price high to low — displayed prices are all wrong', { tag: [P2, regression] }, async () => {
        // Bug: Fleece Jacket shows $90.71 instead of $49.99 for visual_user
        await inventoryPage.sortBy(testdata.sort.price_high_low.value);
        const firstPrice = await inventoryPage.itemPrices.first().textContent();
        expect(firstPrice).toBe(testdata.sort.price_high_low.first_price);
    });

    test('[TC_INV_55] sort order cannot be visually verified — all displayed prices are wrong', { tag: [P2, regression] }, async () => {
        // Bug: even if backend sort is correct, user sees wrong prices — cannot trust the display
        await inventoryPage.sortBy(testdata.sort.price_low_high.value);
        const prices = await inventoryPage.getAllProductPrices();
        const standardPrices = testdata.products.map(p => p.price);
        const allMatch = prices.every(p => standardPrices.includes(p));
        expect(allMatch).toBe(false);
    });
});
