export class CheckoutPage {

    /**
     * @param {import("@playwright/test").Page} page
     */
    constructor(page) {
        this.page = page;

        // Shared
        this.pageTitle = page.locator('[data-test="title"]');
        this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');

        // Step one - info form
        this.firstNameInput = page.locator('[data-test="firstName"]');
        this.lastNameInput = page.locator('[data-test="lastName"]');
        this.zipCodeInput = page.locator('[data-test="postalCode"]');
        this.continueButton = page.locator('[data-test="continue"]');
        this.cancelButton = page.locator('[data-test="cancel"]');
        this.errorMessage = page.locator('[data-test="error"]');

        // Step two - order summary
        this.cartItems = page.locator('[data-test="cart-item"]');
        this.itemNames = page.locator('[data-test="inventory-item-name"]');
        this.itemPrices = page.locator('[data-test="inventory-item-price"]');
        this.paymentInfoValue = page.locator('[data-test="payment-info-value"]');
        this.shippingInfoValue = page.locator('[data-test="shipping-info-value"]');
        this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
        this.taxLabel = page.locator('[data-test="tax-label"]');
        this.totalLabel = page.locator('[data-test="total-label"]');
        this.finishButton = page.locator('[data-test="finish"]');

        // Complete page
        this.completeHeader = page.locator('.complete-header');
        this.completeText = page.locator('.complete-text');
        this.backHomeButton = page.locator('[data-test="back-to-products"]');
        this.ponyImage = page.locator('[data-test="pony-express"]');
    }

    async gotoStepOne() {
        await this.page.goto('/checkout-step-one.html');
    }

    async fillStepOne({ firstName, lastName, zip }) {
        if (firstName) await this.firstNameInput.fill(firstName);
        if (lastName) await this.lastNameInput.fill(lastName);
        if (zip) await this.zipCodeInput.fill(zip);
        await this.continueButton.click();
    }

    async clearStepOne() {
        await this.firstNameInput.clear();
        await this.lastNameInput.clear();
        await this.zipCodeInput.clear();
    }
}
