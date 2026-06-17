/**
 * Wraps all /carts endpoints (GET, POST, PUT, DELETE).
 * Every method accepts an optional `token` — if omitted the request is sent without auth,
 * which tests that endpoints are publicly accessible.
 */
export class CartClient {

    /**
     * Stores Playwright's HTTP client so every method can reuse it.
     * @param {import('@playwright/test').APIRequestContext} request
     */
    constructor(request) {
        this.request = request;
    }

    /**
     * Private helper — builds the Authorization header when a token is provided,
     * or returns an empty object (no header) when called without a token.
     * The `#` prefix makes this a true private field — it cannot be called from outside the class.
     * @param {string} [token]
     * @returns {{ Authorization: string } | {}}
     */
    #headers(token) {
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    /**
     * GET /carts — returns all carts.
     * @param {string} [token]
     * @returns {Promise<import('@playwright/test').APIResponse>}
     */
    async getAll(token) {
        return this.request.get('/carts', { headers: this.#headers(token) });
    }

    /**
     * GET /carts/{id} — returns a single cart by ID.
     * FakeStoreAPI returns 200 + null body when the ID does not exist.
     * @param {number} id
     * @param {string} [token]
     * @returns {Promise<import('@playwright/test').APIResponse>}
     */
    async getById(id, token) {
        return this.request.get(`/carts/${id}`, { headers: this.#headers(token) });
    }

    /**
     * POST /carts — creates a new cart and returns the created object with a generated `id`.
     * FakeStoreAPI responds with 201 (not 200) for successful creation.
     * @param {{ userId: number; date: string; products: { productId: number; quantity: number }[] }} payload
     * @param {string} [token]
     * @returns {Promise<import('@playwright/test').APIResponse>}
     */
    async create(payload, token) {
        return this.request.post('/carts', {
            data: payload,
            headers: this.#headers(token),
        });
    }

    /**
     * PUT /carts/{id} — updates a cart by ID and returns the updated object.
     * FakeStoreAPI performs an upsert — if the ID does not exist it creates the cart instead of returning null.
     * @param {number} id
     * @param {{ userId: number; date: string; products: { productId: number; quantity: number }[] }} payload
     * @param {string} [token]
     * @returns {Promise<import('@playwright/test').APIResponse>}
     */
    async update(id, payload, token) {
        return this.request.put(`/carts/${id}`, {
            data: payload,
            headers: this.#headers(token),
        });
    }

    /**
     * DELETE /carts/{id} — deletes a cart and returns the deleted cart object (or null if not found).
     * @param {number} id
     * @param {string} [token]
     * @returns {Promise<import('@playwright/test').APIResponse>}
     */
    async delete(id, token) {
        return this.request.delete(`/carts/${id}`, { headers: this.#headers(token) });
    }
}
