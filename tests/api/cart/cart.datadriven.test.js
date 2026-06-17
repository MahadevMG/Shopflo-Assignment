import { test, expect } from '@playwright/test';
import { AuthClient } from '../../../api/clients/auth.client.js';
import { CartClient } from '../../../api/clients/cart.client.js';
import { validateCartSchema } from '../../../api/schemas/cart.schema.js';
import authdata from '../../../testdata/api/auth.json';
import cartdata from '../../../testdata/api/cart.json';  // datadriven_products: [1, 2, 3]

// Pull the list of product IDs to test from testdata — no hardcoded values in test files
const productIds = cartdata.datadriven_products;

test.describe('Cart - data-driven: create cart with different product IDs', () => {
    let token;

    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    // `for...of` loop generates one named `test()` per product ID at collection time.
    // Playwright sees them as separate tests, so each gets its own row in the report.
    for (const productId of productIds) {
        test(`create cart with productId ${productId} returns valid cart`, async ({ request }) => {
            const client  = new CartClient(request);

            // Build a minimal cart payload with just one product — the ID changes each iteration
            const payload = {
                userId:   1,
                date:     '2024-06-17',
                products: [{ productId, quantity: 1 }],
            };

            const res = await client.create(payload, token);

            expect(res.status()).toBe(201);
            const body = await res.json();
            validateCartSchema(body);
            expect(body.products[0].productId).toBe(productId);  // confirm the right product was stored
            expect(body.products[0].quantity).toBe(1);
        });
    }
});
