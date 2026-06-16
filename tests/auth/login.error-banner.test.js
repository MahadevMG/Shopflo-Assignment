import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import testdata from '../../testdata/login.json';
import tags from '../../testdata/tags.json';
import { ENV } from '../../utils/env.js';

const { regression, P1 } = tags;

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

    test("[TC_AUTH_09] inline field X icons clear input content", { tag: [regression, P1] }, async () => {
        // KNOWN FAILURE: Spec says clicking the SVG X icons inside input fields clears their content.
        // The icons are decorative — clicking them does not clear the field value.
        // This test documents the spec vs app discrepancy; remove test.fail() if the app is fixed.
        test.fail();

        await loginPage.login(ENV.locked_out_user, ENV.password);

        await expect(loginPage.usernameErrorIcon).toBeVisible();
        await expect(loginPage.passwordErrorIcon).toBeVisible();

        await loginPage.usernameErrorIcon.click();
        await expect(loginPage.usernameInput).toHaveValue('');

        await loginPage.passwordErrorIcon.click();
        await expect(loginPage.passwordInput).toHaveValue('');
    });

});
