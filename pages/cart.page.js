export class CartPage {

    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor(page) {
        this.page = page;

        this.pageTitle = page.locator('[data-test="title"]');
        this.cartList = page.locator('[data-test="cart-list"]');
        this.cartItems = page.locator('[data-test="inventory-item"]');
        this.itemNames = page.locator('[data-test="inventory-item-name"]');
        this.itemPrices = page.locator('[data-test="inventory-item-price"]');
        this.itemDescriptions = page.locator('[data-test="inventory-item-desc"]');
        this.itemQuantities = page.locator('[data-test="item-quantity"]');
        this.removeButton = page.getByRole('button', { name: 'Remove' });
        this.qtyLabel = page.locator('[data-test="cart-quantity-label"]');
        this.descLabel = page.locator('[data-test="cart-desc-label"]');
        this.cartFooter = page.locator('.cart_footer');
        this.continueShopping = page.locator('[data-test="continue-shopping"]');
        this.checkoutButton = page.locator('[data-test="checkout"]');
        this.twitterLink = page.locator('[data-test="social-twitter"]');
        this.facebookLink = page.locator('[data-test="social-facebook"]');
        this.linkedinLink = page.locator('[data-test="social-linkedin"]');
        this.footerCopy = page.locator('[data-test="footer-copy"]');
    }

    async goto() {
        await this.page.goto('/cart.html');
    }

    async removeItem(name) {
        await this.cartItems.filter({ hasText: name }).locator(this.removeButton).click();
    }

    async getItemCount() {
        return await this.cartItems.count();
    }
}
