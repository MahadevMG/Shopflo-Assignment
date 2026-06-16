import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import testdata from '../../testdata/login.json';
import tags from '../../testdata/tags.json';

const { regression, P2 } = tags;

test.describe("Login UI", () => {

    /** @type {LoginPage} */
    let loginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test("[TC_AUTH_15] password field is masked", { tag: [regression, P2] }, async () => {
        const tc = testdata.password_masking.TC_AUTH_15;
        await expect(loginPage.passwordInput).toHaveAttribute('type', tc.expected_type);
    });

});
