import { test, expect } from '@playwright/test';
import { AuthClient } from '../../../api/clients/auth.client.js';
import { CartClient } from '../../../api/clients/cart.client.js';
import { validateCartSchema } from '../../../api/schemas/cart.schema.js';
import authdata from '../../../testdata/api/auth.json';
import cartdata from '../../../testdata/api/cart.json';  // existing_cart_id, nonexistent_cart_id

test.describe('Cart Delete - DELETE /carts/{id}', () => {
    let token;

    // Login once — all DELETE tests in this block share the same token
    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    test('positive - DELETE /carts/{id} returns 200 with the deleted cart', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.delete(cartdata.existing_cart_id, token);

        expect(res.status()).toBe(200);
        const body = await res.json();
        validateCartSchema(body);  // FakeStoreAPI returns the full cart object in the DELETE response
    });

    test('positive - DELETE response body contains the cart that was deleted', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.delete(cartdata.existing_cart_id, token);
        const body   = await res.json();

        // Confirms the response reflects the cart we deleted — not a different one
        expect(body.id).toBe(cartdata.existing_cart_id);
    });

    test('schema - DELETE response has id, userId, products fields', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.delete(cartdata.existing_cart_id, token);
        const body   = await res.json();

        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('userId');
        expect(body).toHaveProperty('products');
    });

    test('negative - DELETE /carts/{nonexistent_id} returns null body', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.delete(cartdata.nonexistent_cart_id, token);

        // FakeStoreAPI quirk: returns 200 with null body for a non-existent ID (not 404)
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toBeNull();
    });

    test('positive - DELETE without token still returns 200 (public endpoint)', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.delete(cartdata.existing_cart_id);  // no token — public access test

        expect(res.status()).toBe(200);
    });
});
