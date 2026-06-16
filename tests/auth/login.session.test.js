import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { InventoryPage } from '../../pages/inventory.page';
import testdata from '../../testdata/login.json';
import { ENV } from '../../utils/env.js';

const { smoke, regression, P1 } = testdata.tags;

test.describe("Session", () => {
    test.describe.configure({ mode: 'serial' });

    /** @type {LoginPage} */
    let loginPage;
    /** @type {InventoryPage} */
    let inventoryPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        await loginPage.goto();
    });

    test("[TC_AUTH_17] logout redirects to login page", { tag: [smoke, P1] }, async ({ page }) => {
        await loginPage.login(ENV.standard_user, ENV.password);
        await inventoryPage.logout();

        await expect(page).toHaveURL('/');
        await expect(loginPage.loginButton).toBeVisible();
    });

    test("[TC_AUTH_18] back button after logout does not restore session", { tag: [regression, P1] }, async ({ page }) => {
        await loginPage.login(ENV.standard_user, ENV.password);
        await inventoryPage.logout();
        await page.goBack();

        await expect(page).toHaveURL('/');
        await expect(loginPage.loginButton).toBeVisible();
    });

    test("[TC_AUTH_20] direct URL access without login redirects to login", { tag: [regression, P1] }, async ({ page }) => {
        const tc = testdata.session.TC_AUTH_20;
        await page.goto(tc.url);

        await expect(page).toHaveURL('/');
        await expect(loginPage.errorMessage).toHaveText(tc.expected_error);
    });

});
