import { test, expect } from '@playwright/test';
import { AuthClient } from '../../../api/clients/auth.client.js';
import { CartClient } from '../../../api/clients/cart.client.js';
import { assertMatchesContract } from '../../../api/schemas/contract.js';
import authdata from '../../../testdata/api/auth.json';
import cartdata from '../../../testdata/api/cart.json';
import readContract     from '../../../testdata/api/contracts/cart-read.contract.json';      // shape for GET + DELETE
import mutationContract from '../../../testdata/api/contracts/cart-mutation.contract.json';  // shape for POST + PUT

/**
 * Contract / snapshot tests.
 *
 * These tests lock the response shape to a known-good snapshot.
 * If FakeStoreAPI renames a field, changes a type, or drops a field, these tests will fail
 * and surface the breaking change before it reaches production code.
 *
 * Two contracts exist because the API returns different shapes:
 *   cart-read.contract.json     — GET + DELETE include MongoDB's `__v` version key
 *   cart-mutation.contract.json — POST + PUT echo the payload without `__v`
 */
test.describe('Cart API - Contract / Snapshot Tests', () => {
    let token;

    // Fetch auth token once — reused across all contract tests
    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    test('contract - GET /carts/{id} response matches read contract snapshot', async ({ request }) => {
        const res  = await new CartClient(request).getById(cartdata.existing_cart_id, token);
        const body = await res.json();

        expect(res.status()).toBe(200);
        assertMatchesContract(body, readContract);  // walk every field in the contract and assert type
    });

    test('contract - GET /carts all items conform to read contract snapshot', async ({ request }) => {
        const res  = await new CartClient(request).getAll(token);
        const body = await res.json();

        expect(res.status()).toBe(200);
        expect(Array.isArray(body)).toBe(true);

        // Every item in the list must match the same read contract — not just the first one
        for (const cart of body) {
            assertMatchesContract(cart, readContract);
        }
    });

    test('contract - POST /carts response matches mutation contract snapshot', async ({ request }) => {
        const res  = await new CartClient(request).create(cartdata.create, token);
        const body = await res.json();

        expect(res.status()).toBe(201);
        assertMatchesContract(body, mutationContract);  // mutation contract has no __v field
    });

    test('contract - PUT /carts/{id} response matches mutation contract snapshot', async ({ request }) => {
        const res  = await new CartClient(request).update(cartdata.existing_cart_id, cartdata.update, token);
        const body = await res.json();

        expect(res.status()).toBe(200);
        assertMatchesContract(body, mutationContract);
    });

    test('contract - DELETE /carts/{id} response matches read contract snapshot', async ({ request }) => {
        const res  = await new CartClient(request).delete(cartdata.existing_cart_id, token);
        const body = await res.json();

        expect(res.status()).toBe(200);
        // DELETE returns the full stored object (same shape as GET) — so we use the read contract
        assertMatchesContract(body, readContract);
    });
});
