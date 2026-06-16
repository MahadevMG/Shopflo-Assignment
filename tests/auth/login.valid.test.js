import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { InventoryPage } from '../../pages/inventory.page';
import testdata from '../../testdata/login.json';
import { ENV } from '../../utils/env.js';

const { smoke, regression, P1, P2, P3 } = testdata.tags;

test.describe("Valid Login", () => {
    test.describe.configure({ mode: 'parallel' });

    /** @type {LoginPage} */
    let loginPage;
    /** @type {InventoryPage} */
    let inventoryPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        await loginPage.goto();
    });

    test("[TC_AUTH_01] standard_user logs in successfully", { tag: [smoke, P1] }, async ({ page }) => {
        await loginPage.login(ENV.standard_user, ENV.password);

        await expect(page).toHaveURL(/inventory/);
        await expect(page).toHaveTitle(testdata.expected_texts.swag_labs_title);
        await expect(inventoryPage.shoppingCartIcon).toBeVisible();
        await expect(inventoryPage.inventoryList).toBeVisible();
    });

    test("[TC_AUTH_12] performance_glitch_user logs in successfully", { tag: [regression, P2] }, async ({ page }) => {
        await loginPage.login(ENV.performance_glitch_user, ENV.password);

        await expect(page).toHaveURL(/inventory/);
        await expect(page).toHaveTitle(testdata.expected_texts.swag_labs_title);
        await expect(inventoryPage.shoppingCartIcon).toBeVisible();
        await expect(inventoryPage.inventoryList).toBeVisible();
    });

    test("[TC_AUTH_13] error_user logs in successfully", { tag: [regression, P2] }, async ({ page }) => {
        await loginPage.login(ENV.error_user, ENV.password);

        await expect(page).toHaveURL(/inventory/);
        await expect(page).toHaveTitle(testdata.expected_texts.swag_labs_title);
        await expect(inventoryPage.shoppingCartIcon).toBeVisible();
        await expect(inventoryPage.inventoryList).toBeVisible();
    });

    test("[TC_AUTH_14] visual_user logs in successfully", { tag: [regression, P3] }, async ({ page }) => {
        await loginPage.login(ENV.visual_user, ENV.password);

        await expect(page).toHaveURL(/inventory/);
        await expect(page).toHaveTitle(testdata.expected_texts.swag_labs_title);
        await expect(inventoryPage.shoppingCartIcon).toBeVisible();
        await expect(inventoryPage.inventoryList).toBeVisible();
    });

});
