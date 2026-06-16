
export class LoginPage {

    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor(page) {
        this.page = page;

        // Locators 
        this.usernameInput = page.getByRole('textbox', { name: 'Username' });
        this.passwordInput = page.getByPlaceholder('Password');
        this.loginButton = page.getByRole('button', { name: 'Login' });
        this.errorMessage = page.locator('[data-test="error"]');
        this.errorBannerCloseBtn = page.locator('.error-button');
        this.usernameErrorIcon = page.locator('#user-name ~ svg.error_icon');
        this.passwordErrorIcon = page.locator('#password ~ svg.error_icon');
    }

    async goto() {
        await this.page.goto('/')
    }

    /**
     * @param {string} username
     * @param {string} password
     */
    async login(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async getErrorMessage() {
        return await this.errorMessage.textContent();
    }

    async isErrorBannerVisible() {
        return await this.errorMessage.isVisible();
    }

    async closeErrorMessageBanner() {
        await this.errorBannerCloseBtn.click();
    }
}