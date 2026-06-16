import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './env.js';

// __dirname is not available in ESM — derive it from import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
