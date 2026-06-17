# API Test Suite — Assignment 2

REST API test suite for [FakeStore API](https://fakestoreapi.com), built with Playwright's `request` fixture. No browser is launched — all tests are pure HTTP.

> For the full framework design decisions see [docs/index.md - Decisions](./docs/index.md#decisions).  

---

## Table of Contents

- [Folder Structure](#folder-structure)
- [Running API Tests](#running-api-tests)
- [Test Coverage](#test-coverage)
- [API Client Layer](#api-client-layer)
- [Schema Validation](#schema-validation)
- [Contract / Snapshot Testing](#contract--snapshot-testing)
- [Test Data](#test-data)
- [FakeStoreAPI Quirks](#fakestoreapi-quirks)
- [HTML Report](#html-report)

---

## Folder Structure

```
├── api/                                      # API layer — clients and validators
│   ├── clients/
│   │   ├── auth.client.js                    # Wraps POST /auth/login
│   │   └── cart.client.js                    # Wraps GET / POST / PUT / DELETE /carts
│   └── schemas/
│       ├── cart.schema.js                    # Field-type validators (validateCartSchema)
│       └── contract.js                       # Contract / snapshot assertion engine
│
├── tests/api/                                # API test files (no browser)
│   ├── auth/
│   │   └── post.auth.test.js                 # TC_API_01–05 — POST /auth/login
│   └── cart/
│       ├── get.cart.test.js                  # TC_API_06–11 — GET /carts
│       ├── post.cart.test.js                 # TC_API_12–17 — POST /carts
│       ├── put.cart.test.js                  # TC_API_18–22 — PUT /carts/{id}
│       ├── delete.cart.test.js               # TC_API_23–27 — DELETE /carts/{id}
│       ├── cart.datadriven.test.js           # TC_API_28–30 — data-driven POST /carts
│       └── cart.contract.test.js             # TC_API_31–35 — contract / snapshot tests
│
└── testdata/api/
    ├── auth.json                             # Valid + invalid credentials, error messages
    ├── cart.json                             # Cart payloads, IDs, data-driven seeds
    └── contracts/
        ├── cart-read.contract.json           # Shape snapshot — GET + DELETE responses
        └── cart-mutation.contract.json       # Shape snapshot — POST + PUT responses
```

---

## Running API Tests

```bash
# Run all API tests
npx playwright test tests/api/ --project=api

# Run a specific suite
npx playwright test tests/api/auth/ --project=api
npx playwright test tests/api/cart/ --project=api

# Run a specific file
npx playwright test tests/api/cart/get.cart.test.js --project=api

# Run a single test by ID
npx playwright test --grep "TC_API_01" --project=api

# Run all tests (UI + API together)
npm test
```

---

## Test Coverage

| Suite | File | TC IDs | Test Count | Covers |
|---|---|---|---|---|
| Auth | `auth/post.auth.test.js` | TC_API_01–05 | 5 | Login positive/negative, error message body, schema |
| Cart Read | `cart/get.cart.test.js` | TC_API_06–11 | 6 | GET all carts, GET by id, schema, nonexistent id, no-auth |
| Cart Create | `cart/post.cart.test.js` | TC_API_12–17 | 6 | POST single/multi product, schema, no-auth |
| Cart Update | `cart/put.cart.test.js` | TC_API_18–22 | 5 | PUT update, schema, upsert on nonexistent id |
| Cart Delete | `cart/delete.cart.test.js` | TC_API_23–27 | 5 | DELETE, schema, nonexistent id, no-auth |
| Data-driven | `cart/cart.datadriven.test.js` | TC_API_28–30 | 3 | Same POST scenario run over productIds 1, 2, 3 |
| Contract | `cart/cart.contract.test.js` | TC_API_31–35 | 5 | Response shape snapshot for all CRUD operations |
| **Total** | | | **35** | |


---

## API Client Layer

Thin wrapper classes in `api/clients/` take Playwright's `request` fixture in the constructor and return raw `APIResponse` objects. Assertions stay in test files — clients never assert.

### AuthClient

```js
export class AuthClient {
    constructor(request) { this.request = request; }

    // POST /auth/login with credentials — returns raw APIResponse
    async login(username, password) {
        return this.request.post('/auth/login', { data: { username, password } });
    }

    // POST /auth/login with empty body — used for negative tests
    async loginEmpty() {
        return this.request.post('/auth/login', { data: {} });
    }

    // Convenience: login and return just the JWT string
    async getToken(username, password) {
        const res  = await this.login(username, password);
        const body = await res.json();
        return body.token;
    }
}
```

### CartClient

```js
export class CartClient {
    constructor(request) { this.request = request; }

    // Private: builds Authorization header if token provided, empty object if not
    // Allows the same client to test both authenticated and public paths
    #headers(token) {
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async getAll(token)              { return this.request.get('/carts', { headers: this.#headers(token) }); }
    async getById(id, token)         { return this.request.get(`/carts/${id}`, { headers: this.#headers(token) }); }
    async create(payload, token)     { return this.request.post('/carts', { data: payload, headers: this.#headers(token) }); }
    async update(id, payload, token) { return this.request.put(`/carts/${id}`, { data: payload, headers: this.#headers(token) }); }
    async delete(id, token)          { return this.request.delete(`/carts/${id}`, { headers: this.#headers(token) }); }
}
```

### Shared token pattern

Each describe block fetches the token once in `beforeAll` and shares it across all tests:

```js
test.describe('Cart Create - POST /carts', () => {
    let token;

    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    test('positive - create cart returns 201', async ({ request }) => {
        const client = new CartClient(request);    // new client per test — request is per-test
        const res    = await client.create(cartdata.create, token);
        expect(res.status()).toBe(201);
    });
});
```

> `request` is a per-test Playwright fixture — a fresh HTTP context for each test. The `CartClient` is created inside each test so it uses that test's isolated context, not the `beforeAll` context.

---

## Schema Validation

**File:** `api/schemas/cart.schema.js`

Validates field types using Playwright's built-in `expect()`. No external schema library needed.

```js
export function validateCartSchema(cart) {
    expect(typeof cart.id,     'cart.id must be a number').toBe('number');
    expect(typeof cart.userId, 'cart.userId must be a number').toBe('number');
    // typeof [] === 'object' in JS — use Array.isArray for arrays
    expect(Array.isArray(cart.products), 'cart.products must be an array').toBe(true);
    for (const item of cart.products) {
        expect(typeof item.productId, 'product.productId must be a number').toBe('number');
        expect(typeof item.quantity,  'product.quantity must be a number').toBe('number');
    }
}

// Used for GET /carts — asserts the response is a non-empty array of valid carts
export function validateCartListSchema(carts) {
    expect(Array.isArray(carts),  'response must be an array').toBe(true);
    expect(carts.length, 'cart list must not be empty').toBeGreaterThan(0);
    for (const cart of carts) { validateCartSchema(cart); }
}
```

---

## Contract / Snapshot Testing

**File:** `api/schemas/contract.js`  
**Snapshots:** `testdata/api/contracts/`

Contract tests lock the API response shape to a stored JSON snapshot. If FakeStoreAPI ever renames a field, changes a type, or removes a field, these tests fail and surface the breaking change immediately.

### Two contract files

| Contract | Used by | Why different? |
|---|---|---|
| `cart-read.contract.json` | GET + DELETE | Includes MongoDB's `__v` version key |
| `cart-mutation.contract.json` | POST + PUT | Echoes the sent payload — no `__v` |

### Contract format

```json
{
    "_comment": "metadata — skipped during validation",
    "id":       "number",
    "userId":   "number",
    "date":     "string",
    "products": { "productId": "number", "quantity": "number" },
    "__v":      "number"
}
```

- `"field": "number" | "string" | "boolean"` — checks `typeof actual[field]`
- `"field": { ... }` — checks the field is an array, then validates the first item's shape
- Keys starting with `_` are skipped

### Assertion engine

```js
export function assertMatchesContract(actual, contract) {
    for (const [key, expected] of Object.entries(contract)) {
        if (key.startsWith('_')) continue;   // skip _comment, _source

        if (typeof expected === 'object') {
            // array field — value being an object means "array of items with this shape"
            expect(Array.isArray(actual[key]), `"${key}" must be an array`).toBe(true);
            if (actual[key].length > 0) {
                for (const [itemKey, itemType] of Object.entries(expected)) {
                    expect(typeof actual[key][0][itemKey], `"${key}[0].${itemKey}" must be ${itemType}`).toBe(itemType);
                }
            }
        } else {
            // primitive field — "number", "string", "boolean"
            expect(actual).toHaveProperty(key);
            expect(typeof actual[key], `"${key}" must be ${expected}`).toBe(expected);
        }
    }
}
```

### Usage

```js
test('contract - GET /carts/{id} matches read contract', async ({ request }) => {
    const res  = await new CartClient(request).getById(cartdata.existing_cart_id, token);
    const body = await res.json();

    expect(res.status()).toBe(200);
    assertMatchesContract(body, readContract);   // walks every field and asserts type
});
```

---

## Test Data

**File:** `testdata/api/auth.json`

```json
{
    "valid":            { "username": "johnd", "password": "m38rmF$" },
    "invalid_password": { "username": "johnd", "password": "wrongpassword" },
    "invalid_username": { "username": "nonexistent_user_xyz", "password": "anypassword" },
    "empty":            {},
    "error_messages":   { "invalid_credentials": "username or password is incorrect" }
}
```

**File:** `testdata/api/cart.json`

```json
{
    "existing_cart_id":    1,
    "nonexistent_cart_id": 99999,
    "create":              { "userId": 1, "date": "2024-06-17", "products": [{ "productId": 5, "quantity": 1 }] },
    "create_multi_product":{ "userId": 2, "date": "2024-06-17", "products": [{ "productId": 1, "quantity": 2 }, { "productId": 3, "quantity": 1 }] },
    "update":              { "userId": 1, "date": "2024-06-17", "products": [{ "productId": 7, "quantity": 3 }] },
    "datadriven_products": [1, 2, 3]
}
```

> Credentials come from the pre-seeded users in FakeStoreAPI. Run `curl https://fakestoreapi.com/users` to see all available accounts.

---

## FakeStoreAPI Quirks

These are known behaviours of the fake API that differ from a typical REST API. Tests account for all of them:

| Scenario | Actual behaviour | What test expects |
|---|---|---|
| POST /carts | Returns **201** (not 200) | `expect(res.status()).toBe(201)` |
| GET /carts/{nonexistent_id} | Returns **200 + null body** (not 404) | `expect(body).toBeNull()` |
| PUT /carts/{nonexistent_id} | **Upserts** — creates the cart instead of returning null | `expect(body.id).toBe(nonexistent_cart_id)` |
| DELETE /carts/{nonexistent_id} | Returns **200 + null body** (not 404) | `expect(body).toBeNull()` |
| GET + DELETE responses | Include MongoDB `__v` field | Covered by `cart-read.contract.json` |
| POST + PUT responses | Do **not** include `__v` | Covered by `cart-mutation.contract.json` |
| Auth error response | Returns a **plain string**, not JSON | Use `res.text()` not `res.json()` |

---

## HTML Report

API tests share the same Playwright HTML report as UI tests. Run the suite then open it:

```bash
npx playwright test tests/api/ --project=api
npx playwright show-report
```

The report groups results by project. The `api` project section shows each test with pass/fail, duration, and full error details (actual vs expected values) on failure. No screenshots or video — there is no browser.
