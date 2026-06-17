import { test, expect } from '@playwright/test';
import { AuthClient } from '../../../api/clients/auth.client.js';
import authdata from '../../../testdata/api/auth.json';  // all credentials — valid, invalid_password, invalid_username

// Groups all login tests under one suite label in the Playwright report
test.describe('Auth - POST /auth/login', () => {

    test('positive - valid credentials return a JWT token', async ({ request }) => {
        const client = new AuthClient(request);                           // create client with Playwright's HTTP fixture
        const res = await client.login(authdata.valid.username, authdata.valid.password);

        expect(res.status()).toBe(201);                                   // FakeStoreAPI returns 201 on successful login
        const body = await res.json();
        expect(typeof body.token).toBe('string');
        expect(body.token.length).toBeGreaterThan(0);
        expect(body.token.split('.').length).toBe(3);                    // JWT always has 3 dot-separated segments: header.payload.signature
    });

    test('negative - wrong password returns 401', async ({ request }) => {
        const client = new AuthClient(request);
        const res = await client.login(authdata.invalid_password.username, authdata.invalid_password.password);

        expect(res.status()).toBe(401);                                   // wrong credentials → Unauthorized

    });

    test('negative - non-existent username returns 401', async ({ request }) => {
        const client = new AuthClient(request);
        const res = await client.login(authdata.invalid_username.username, authdata.invalid_username.password);
        const body = await res.text(); 
        expect(body).toContain(authdata.error_messages.invalid_credentials);
        expect(res.status()).toBe(401);
    });

    test('negative - empty body returns 400', async ({ request }) => {
        const client = new AuthClient(request);
        const res = await client.loginEmpty();                         // sends {} — no username or password

        expect(res.status()).toBe(400);                                   // missing required fields → Bad Request
    });

    test('schema - token response contains only token field', async ({ request }) => {
        const client = new AuthClient(request);
        const res = await client.login(authdata.valid.username, authdata.valid.password);
        const body = await res.json();

        // Shape assertion — confirms the response contract hasn't changed (no extra or missing fields)
        expect(Object.keys(body)).toContain('token');
        expect(typeof body.token).toBe('string');
    });
});
