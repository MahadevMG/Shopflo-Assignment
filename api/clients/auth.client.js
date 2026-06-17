/**
 * Wraps all requests to POST /auth/login.
 * All methods return the raw Playwright APIResponse — assertions stay in the test.
 */
export class AuthClient {

    /**
     * Stores Playwright's HTTP client fixture so every method can reuse it.
     * `request` is injected by the framework per-test and keeps each test's HTTP context isolated.
     * @param {import('@playwright/test').APIRequestContext} request
     */
    constructor(request) {
        this.request = request;
    }

    /**
     * POST /auth/login with the given credentials.
     * `data` is serialised to JSON automatically by Playwright.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<import('@playwright/test').APIResponse>}
     */
    async login(username, password) {
        return this.request.post('/auth/login', {
            data: { username, password },
        });
    }

    /**
     * POST /auth/login with an empty body `{}`.
     * Used to verify the API rejects a request when required fields are missing.
     * @returns {Promise<import('@playwright/test').APIResponse>}
     */
    async loginEmpty() {
        return this.request.post('/auth/login', { data: {} });
    }

    /**
     * Logs in and returns only the JWT string from the response body.
     * Used in `test.beforeAll` to fetch a shared token once for the whole describe block.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<string>} JWT token
     */
    async getToken(username, password) {
        const res  = await this.login(username, password);
        const body = await res.json();   // parse JSON response body to JS object
        return body.token;               // extract the JWT string
    }
}
