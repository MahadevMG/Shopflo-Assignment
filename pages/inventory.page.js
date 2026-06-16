export class InventoryPage {

    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor(page) {
        this.page = page;

        this.shoppingCartIcon = page.locator('[data-test="shopping-cart-link"]');
        this.inventoryList = page.locator('[data-test="inventory-list"]');
        this.inventoryItems = page.locator('[data-test="inventory-item"]');
        this.menuButton = page.getByRole('button', { name: 'Open Menu' });
        this.logoutLink = page.getByRole('link', { name: 'Logout' });
    }

    async logout() {
        await this.menuButton.click();
        await this.logoutLink.click();
    }
}
