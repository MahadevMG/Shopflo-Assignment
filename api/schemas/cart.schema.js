import { expect } from '@playwright/test';

/**
 * Asserts that a single cart object has the correct field types.
 * Uses `typeof` for primitives and `Array.isArray` for arrays (typeof [] === 'object' in JS, so we can't use typeof).
 * @param {{ id: number; userId: number; products: { productId: number; quantity: number }[] }} cart
 */
export function validateCartSchema(cart) {
    expect(typeof cart.id, 'cart.id must be a number').toBe('number');
    expect(typeof cart.userId, 'cart.userId must be a number').toBe('number');
    expect(Array.isArray(cart.products), 'cart.products must be an array').toBe(true);

    // Walk every product item and assert its field types
    for (const item of cart.products) {
        expect(typeof item.productId, 'product.productId must be a number').toBe('number');
        expect(typeof item.quantity, 'product.quantity must be a number').toBe('number');
    }
}

/**
 * Asserts that a GET /carts response is a non-empty array of valid carts.
 * Delegates individual item validation to validateCartSchema.
 * @param {any[]} carts
 */
export function validateCartListSchema(carts) {
    expect(Array.isArray(carts), 'response must be an array').toBe(true);
    expect(carts.length, 'cart list must not be empty').toBeGreaterThan(0);

    for (const cart of carts) {
        validateCartSchema(cart);  // reuse single-cart validation for every item
    }
}
