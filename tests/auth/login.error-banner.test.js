import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import testdata from '../../testdata/login.json';
import { ENV } from '../../utils/env.js';

const { regression, P1 } = testdata.tags;

test.describe("Error Banner", () => {

    /** @type {LoginPage} */
    let loginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test("[TC_AUTH_07] locked_out_user sees error banner and can dismiss it", { tag: [regression, P1] }, async () => {
        const tc = testdata.error_banner.TC_AUTH_07;
        await loginPage.login(ENV.locked_out_user, ENV.password);

        await expect(loginPage.errorMessage).toHaveText(tc.expected_error);
        await expect(loginPage.errorBannerCloseBtn).toBeVisible();
        await loginPage.closeErrorMessageBanner();
        await expect(loginPage.errorMessage).not.toBeVisible();
    });

});
