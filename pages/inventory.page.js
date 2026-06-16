export class InventoryPage {

    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor(page) {
        this.page = page;

        this.shoppingCartIcon = page.locator('[data-test="shopping-cart-link"]');
        this.cartBadge = page.locator('[data-test="shopping-cart-badge"]'); // Whole area of the product list 
        this.inventoryList = page.locator('[data-test="inventory-list"]');
        this.inventoryItems = page.locator('[data-test="inventory-item"]');
        this.itemNames = page.locator('[data-test="inventory-item-name"]');
        this.itemPrices = page.locator('[data-test="inventory-item-price"]');
        this.itemImages = page.locator('.inventory_item_img img');
        this.appLogo = page.locator('.app_logo');
        this.sortDropdown = page.locator('[data-test="product-sort-container"]');
        this.productPageTitle = page.locator('[data-test="title"]');
        this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
        this.removeFromCartButton = page.getByRole('button', { name: 'Remove' });
        // Options under menu
        this.menuButton = page.getByRole('button', { name: 'Open Menu' });
        this.allItemsLink = page.locator('[data-test="inventory-sidebar-link"]');
        this.aboutLink = page.locator('[data-test="about-sidebar-link"]');
        this.logoutLink = page.locator('[data-test="logout-sidebar-link"]');
        this.resetAppStateLink = page.locator('[data-test="reset-sidebar-link"]');
        this.closeMenuButton = page.locator('[data-test="close-menu"]');
    }

    async goto() {
        await this.page.goto('/inventory.html');
    }

    async logout() {
        await this.menuButton.click();
        await this.logoutLink.click();
    }

    async openMenu() {
        await this.menuButton.click();
    }

    async closeMenu() {
        await this.closeMenuButton.click();
    }

    /**
     * @param {string | readonly string[] | import("playwright-core").ElementHandle<Node> | { value?: string; label?: string; index?: number; } | readonly import("playwright-core").ElementHandle<Node>[] | readonly { value?: string; label?: string; index?: number; }[]} value
     */
    async sortBy(value) {
        await this.sortDropdown.selectOption(value);
    }

    async getAllProductNames() {
        return await this.itemNames.allTextContents();
    }

    async getAllProductPrices() {
        return await this.itemPrices.allTextContents();
    }

    // Finds the product card containing the given name, then clicks its Add to cart button.
    /**
     * @param {any} productName
     */
    async addToCartByName(productName) {
        await this.inventoryItems
            .filter({ hasText: productName })
            .locator(this.addToCartButton)
            .click();
    }

    /**
     * @param {any} productName
     */
    async removeByName(productName) {
        await this.inventoryItems
            .filter({ hasText: productName })
            .locator(this.removeFromCartButton)
            .click();
    }

    async getCartCount() {
        const badge = this.cartBadge;
        if (await badge.isVisible()) return parseInt(await badge.textContent());
        return 0;
    }
}
