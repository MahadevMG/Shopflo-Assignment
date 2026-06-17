import { test, expect } from '@playwright/test';
import { AuthClient } from '../../../api/clients/auth.client.js';
import { CartClient } from '../../../api/clients/cart.client.js';
import { validateCartSchema } from '../../../api/schemas/cart.schema.js';
import authdata from '../../../testdata/api/auth.json';
import cartdata from '../../../testdata/api/cart.json';  // create, create_multi_product payloads

test.describe('Cart Create - POST /carts', () => {
    let token;

    // Login once before all tests — token is reused to avoid redundant auth calls
    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    test('positive - create cart returns 200 with new cart object', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.create(cartdata.create, token);

        expect(res.status()).toBe(201);    // FakeStoreAPI returns 201 Created (not 200)
        const body = await res.json();
        validateCartSchema(body);          // asserts id/userId/products types are correct
    });

    test('positive - created cart reflects the sent userId', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.create(cartdata.create, token);
        const body   = await res.json();

        // Confirms the API echoes back what we sent — not just any userId
        expect(body.userId).toBe(cartdata.create.userId);
    });

    test('positive - created cart reflects sent products', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.create(cartdata.create, token);
        const body   = await res.json();

        expect(body.products).toHaveLength(cartdata.create.products.length);
        expect(body.products[0].productId).toBe(cartdata.create.products[0].productId);
        expect(body.products[0].quantity).toBe(cartdata.create.products[0].quantity);
    });

    test('positive - create cart with multiple products', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.create(cartdata.create_multi_product, token);  // payload with 2+ items

        expect(res.status()).toBe(201);
        const body = await res.json();
        validateCartSchema(body);
        expect(body.products).toHaveLength(cartdata.create_multi_product.products.length);
    });

    test('schema - POST /carts response has id, userId, products', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.create(cartdata.create, token);
        const body   = await res.json();

        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('userId');
        expect(body).toHaveProperty('products');
        expect(typeof body.id).toBe('number');  // id is auto-generated — just verify it's a number
    });

    test('positive - create cart without auth token still succeeds (public endpoint)', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.create(cartdata.create);  // no token — tests public access

        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(typeof body.id).toBe('number');
    });
});
