import { test, expect } from '@playwright/test';
import { AuthClient } from '../../../api/clients/auth.client.js';
import { CartClient } from '../../../api/clients/cart.client.js';
import { validateCartSchema } from '../../../api/schemas/cart.schema.js';
import authdata from '../../../testdata/api/auth.json';
import cartdata from '../../../testdata/api/cart.json';  // existing_cart_id, nonexistent_cart_id, update payload

test.describe('Cart Update - PUT /carts/{id}', () => {
    let token;

    // Login once — token is shared across all PUT tests in this block
    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    test('positive - PUT /carts/{id} returns 200 with updated cart', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.update(cartdata.existing_cart_id, cartdata.update, token);

        expect(res.status()).toBe(200);
        const body = await res.json();
        validateCartSchema(body);  // asserts field types after update
    });

    test('positive - updated cart reflects new userId', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.update(cartdata.existing_cart_id, cartdata.update, token);
        const body = await res.json();

        // Verifies the API applied our changes — not just returning the old record
        expect(body.userId).toBe(cartdata.update.userId);
    });

    test('positive - updated cart reflects new products', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.update(cartdata.existing_cart_id, cartdata.update, token);
        const body = await res.json();

        expect(body.products[0].productId).toBe(cartdata.update.products[0].productId);
        expect(body.products[0].quantity).toBe(cartdata.update.products[0].quantity);
    });

    test('schema - PUT response has id, userId, products fields', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.update(cartdata.existing_cart_id, cartdata.update, token);
        const body = await res.json();

        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('userId');
        expect(body).toHaveProperty('products');
    });

    test('negative - PUT /carts/{nonexistent_id} acts as upsert and returns the given payload', async ({ request }) => {
        // FakeStoreAPI does NOT return null for a missing ID — it performs an upsert (creates the cart).
        // This is a known quirk of the fake API; a real API would typically return 404.
        const client = new CartClient(request);
        const res = await client.update(cartdata.nonexistent_cart_id, cartdata.update, token);

        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).not.toBeNull();
        expect(body.id).toBe(cartdata.nonexistent_cart_id);  // upserted cart carries our requested ID
    });
});
