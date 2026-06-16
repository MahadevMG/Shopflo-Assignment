import { test as setup } from '@playwright/test';
import path from 'path';
import { ENV } from './env.js';

// Saves authenticated session to this file — reused by feature test projects
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate as standard_user', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill(ENV.standard_user);
    await page.getByPlaceholder('Password').fill(ENV.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/inventory/);

    // Persists cookies + localStorage so feature tests start already logged in
    await page.context().storageState({ path: authFile });
});
