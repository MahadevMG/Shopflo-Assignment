import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import testdata from '../../testdata/login.json';

const { regression, P1, P2, P3 } = testdata.tags;

test.describe("Invalid Login", () => {
    test.describe.configure({ mode: 'parallel' });

    /** @type {LoginPage} */
    let loginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test("[TC_AUTH_02] empty credentials shows username required error", { tag: [regression, P2] }, async () => {
        const tc = testdata.invalid_users.TC_AUTH_02;
        await loginPage.login(tc.user, tc.password);

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toHaveText(tc.expected_error);
        await expect(loginPage.usernameErrorIcon).toBeVisible();
        await expect(loginPage.passwordErrorIcon).toBeVisible();
    });

    test("[TC_AUTH_03] missing password shows password required error", { tag: [regression, P3] }, async () => {
        const tc = testdata.invalid_users.TC_AUTH_03;
        await loginPage.login(tc.user, tc.password);

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toHaveText(tc.expected_error);
        await expect(loginPage.passwordErrorIcon).toBeVisible();
    });

    test("[TC_AUTH_04] missing username shows username required error", { tag: [regression, P3] }, async () => {
        const tc = testdata.invalid_users.TC_AUTH_04;
        await loginPage.login(tc.user, tc.password);

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toHaveText(tc.expected_error);
        await expect(loginPage.usernameErrorIcon).toBeVisible();
    });

    test("[TC_AUTH_05] wrong username shows invalid credentials error", { tag: [regression, P1] }, async () => {
        const tc = testdata.invalid_users.TC_AUTH_05;
        await loginPage.login(tc.user, tc.password);

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toHaveText(tc.expected_error);
    });

    test("[TC_AUTH_06] wrong password shows invalid credentials error", { tag: [regression, P1] }, async () => {
        const tc = testdata.invalid_users.TC_AUTH_06;
        await loginPage.login(tc.user, tc.password);

        await expect(loginPage.errorMessage).toBeVisible();
        await expect(loginPage.errorMessage).toHaveText(tc.expected_error);
    });

    // KNOWN FAILURES — spec defines error messages with emoji prefix ("😢 ...") but the app
    // renders "Epic sadface: ..." instead. These tests document the discrepancy.
    // Remove test.fail() and update the assertion string when spec and app align.

    test("[TC_AUTH_02_EMOJI] spec: username-required error uses emoji prefix", { tag: [regression, P3] }, async () => {
        // test.fail();
        await loginPage.login('', '');
        await expect(loginPage.errorMessage).toHaveText('😢 Username is required');
    });

    test("[TC_AUTH_03_EMOJI] spec: password-required error uses emoji prefix", { tag: [regression, P3] }, async () => {
        test.fail();
        await loginPage.login('standard_user', '');
        await expect(loginPage.errorMessage).toHaveText('😢 Password is required');
    });

});
