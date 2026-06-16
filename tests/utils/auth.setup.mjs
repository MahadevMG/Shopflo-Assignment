import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from '../../utils/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, '../../playwright/.auth');

const users = [
    ENV.standard_user,
    ENV.problem_user,
    ENV.visual_user,
    ENV.error_user,
    ENV.performance_glitch_user,
];

for (const username of users) {
    setup(`authenticate as ${username}`, async ({ page }) => {
        await page.goto('/');
        await page.getByRole('textbox', { name: 'Username' }).fill(username);
        await page.getByPlaceholder('Password').fill(ENV.password);
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL(/inventory/);
        await page.context().storageState({ path: path.join(authDir, `${username}.json`) });
    });
}
