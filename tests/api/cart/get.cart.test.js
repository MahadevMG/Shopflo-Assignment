import { test, expect } from '@playwright/test';
import { AuthClient } from '../../../api/clients/auth.client.js';
import { CartClient } from '../../../api/clients/cart.client.js';
import { validateCartSchema, validateCartListSchema } from '../../../api/schemas/cart.schema.js';
import authdata from '../../../testdata/api/auth.json';
import cartdata from '../../../testdata/api/cart.json';  // existing_cart_id, nonexistent_cart_id

test.describe('Cart Read - GET /carts', () => {
    let token;  // shared across all tests in this block

    // beforeAll runs once before any test in this describe block.
    // Fetching the token once here avoids making a login request in every individual test.
    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    test('positive - GET /carts returns 200 with array of carts', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.getAll(token);

        expect(res.status()).toBe(200);
        const body = await res.json();
        validateCartListSchema(body);  // asserts: is array, not empty, every item is a valid cart
    });

    test('positive - GET /carts/{id} returns single cart with correct id', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.getById(cartdata.existing_cart_id, token);

        expect(res.status()).toBe(200);
        const body = await res.json();
        validateCartSchema(body);                            // asserts field types
        expect(body.id).toBe(cartdata.existing_cart_id);    // confirms the right record was returned
    });

    test('schema - GET /carts/{id} response has id, userId, products array', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.getById(cartdata.existing_cart_id, token);
        const body = await res.json();

        // Explicit property presence checks — catches renames or missing fields
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('userId');
        expect(body).toHaveProperty('products');
        expect(Array.isArray(body.products)).toBe(true);
    });

    test('schema - each product in cart has productId and quantity as numbers', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.getById(cartdata.existing_cart_id, token);
        const body = await res.json();

        for (const item of body.products) {
            expect(typeof item.productId).toBe('number');
            expect(typeof item.quantity).toBe('number');
        }
    });

    test('negative - GET /carts/{nonexistent_id} returns null body', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.getById(cartdata.nonexistent_cart_id, token);

        // FakeStoreAPI quirk: returns 200 with null body instead of 404 for missing resources
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toBeNull();
    });

    test('positive - GET /carts without token still returns 200 (public endpoint)', async ({ request }) => {
        const client = new CartClient(request);
        const res = await client.getAll();  // no token passed — tests that auth is not required

        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
    });
});
