# Playwright Test Framework

## Table of Contents

- [Folder Structure](#folder-structure)
- [NPM Scripts](#npm-scripts)
- [Playwright Config](#playwright-config)
- [Page Object Model (UI)](#page-object-model-ui)
- [API Client Layer](#api-client-layer)
- [Schema Validation](#schema-validation)
- [Contract / Snapshot Testing](#contract--snapshot-testing)
- [Locator Strategy](#locator-strategy)
- [Test Structure](#test-structure)
- [Test Data](#test-data)
- [Environment Variables](#environment-variables)
- [Tagging Strategy](#tagging-strategy)
- [Parallelism and Memory Management](#parallelism-and-memory-management)
- [Session and Auth Setup](#session-and-auth-setup)
- [Projects Overview](#projects-overview)
- [Debugging](#debugging)
- [CI/CD](#cicd)
- [Adding New Tests](#adding-new-tests)

---

## Folder Structure

```
Shopflo-Assignment/
│
├── pages/                               # Page Object Model classes (UI only)
│   ├── login.page.js                    # Login page - locators + actions
│   ├── inventory.page.js                # Inventory page - locators + actions
│   ├── cart.page.js                     # Cart page - locators + actions
│   └── checkout.page.js                 # Checkout pages (step 1, step 2, complete)
│
├── api/                                 # API layer (Assignment 2 - no browser)
│   ├── clients/
│   │   ├── auth.client.js               # POST /auth/login wrapper class
│   │   └── cart.client.js               # Cart CRUD wrapper class (GET/POST/PUT/DELETE)
│   └── schemas/
│       ├── cart.schema.js               # Schema validation helpers using expect()
│       └── contract.js                  # Contract / snapshot assertion engine
│
├── tests/                               # All test files organised by feature
│   ├── auth/
│   │   ├── login.valid.test.js          # TC_AUTH_01, 12, 13, 14 - successful logins
│   │   ├── login.invalid.test.js        # TC_AUTH_02–06 - validation error messages
│   │   ├── login.error-banner.test.js   # TC_AUTH_07 - locked out user + banner dismiss
│   │   ├── login.session.test.js        # TC_AUTH_17, 18, 20 - logout and session handling
│   │   └── login.ui.test.js             # TC_AUTH_15 - password field masking
│   │
│   ├── inventory/
│   │   ├── inventory.display.test.js    # Product listing, images, names, prices
│   │   ├── inventory.sort.test.js       # Sorting (A-Z, Z-A, price low-high, high-low)
│   │   ├── inventory.cart.test.js       # Add/remove from inventory, cart badge count
│   │   ├── inventory.links.test.js      # Product detail page navigation
│   │   └── inventory.nav.test.js        # Navigation (menu, logout, back)
│   │
│   ├── cart/                            # Cart UI tests
│   │
│   ├── checkout/
│   │   ├── checkout.ui.test.js          # TC_CHK_01-03 - form layout per user type
│   │   ├── checkout.validation.test.js  # TC_CHK_04-09 - required field validation
│   │   ├── checkout.navigation.test.js  # TC_CHK_10-11, 19-21, 26 - cancel/continue flow
│   │   ├── checkout.summary.test.js     # TC_CHK_12-18 - step two prices and info
│   │   ├── checkout.complete.test.js    # TC_CHK_22-25, 27 - order confirmation page
│   │   ├── checkout.edge.test.js        # TC_CHK_28-29 - edge cases (XSS, invalid zip)
│   │   └── checkout.e2e.test.js         # TC_CHK_32 - full happy path E2E
│   │
│   ├── api/                             # REST API tests (no browser - uses request fixture)
│   │   ├── auth/
│   │   │   └── post.auth.test.js        # TC_API_01-05 - POST /auth/login
│   │   └── cart/
│   │       ├── get.cart.test.js         # TC_API_06-11 - GET /carts
│   │       ├── post.cart.test.js        # TC_API_12-17 - POST /carts
│   │       ├── put.cart.test.js         # TC_API_18-22 - PUT /carts/{id}
│   │       ├── delete.cart.test.js      # TC_API_23-27 - DELETE /carts/{id}
│   │       ├── cart.datadriven.test.js  # TC_API_28-30 - data-driven POST /carts
│   │       └── cart.contract.test.js    # TC_API_31-35 - contract / snapshot tests
│   │
│   └── utils/
│       └── auth.setup.mjs               # Per-user session setup (saves storageState)
│
├── testdata/                            # Non-sensitive test data only
│   ├── login.json                       # Error messages, expected texts, tags
│   ├── inventory.json                   # Product names, sort options, expected counts
│   ├── tags.json                        # Shared tag definitions (@smoke, @P1, etc.)
│   ├── cart.json                        # Cart item data, expected quantities
│   ├── checkout.json                    # Form inputs, expected labels, prices, errors
│   └── api/
│       ├── auth.json                    # FakeStoreAPI test credentials and variants
│       ├── cart.json                    # Cart payloads, product IDs, data-driven seeds
│       └── contracts/
│           ├── cart-read.contract.json      # Shape snapshot for GET + DELETE responses
│           └── cart-mutation.contract.json  # Shape snapshot for POST + PUT responses
│
├── utils/
│   └── env.js                           # Single place where process.env is read
│
├── playwright/.auth/                    # Auto-generated session files (gitignored)
│   ├── standard_user.json
│   ├── visual_user.json
│   ├── error_user.json
│   ├── problem_user.json
│   └── performance_glitch_user.json
│
├── .github/workflows/playwright.yml     # GitHub Actions CI pipeline
├── playwright.config.js                 # All Playwright configuration
├── .env                                 # Real credentials - never commit (gitignored)
├── .gitignore
└── package.json
```

---

## NPM Scripts

| Script | Command | When to use |
|---|---|---|
| `npm test` | `playwright test` | Full suite - all projects |
| `npm run test:auth` | `playwright test --project=chromium --project=firefox` | Auth tests on both browsers |
| `npm run test:auth:chrome` | `playwright test --project=chromium` | Auth on Chromium only |
| `npm run test:auth:firefox` | `playwright test --project=firefox` | Auth on Firefox only |
| `npm run test:features` | `playwright test --project=chromium-authenticated --project=firefox-authenticated` | Feature UI tests (runs setup first) |
| `npm run test:features:chrome` | `playwright test --project=chromium-authenticated` | Feature on Chrome only |
| `npm run test:features:firefox` | `playwright test --project=firefox-authenticated` | Feature on Firefox only |
| `npm run test:smoke` | `playwright test --grep @smoke` | Quick confidence check |
| `npm run test:regression` | `playwright test --grep @regression` | Full regression suite |
| `npm run test:report` | `playwright show-report` | Open HTML report in browser |

**API tests (no npm script needed — project flag is sufficient):**

```bash
npx playwright test tests/api/ --project=api            # all API tests
npx playwright test tests/api/auth/ --project=api       # auth API only
npx playwright test tests/api/cart/ --project=api       # cart API only
npx playwright test --grep "TC_API_01" --project=api    # single test by ID
```

---

## Playwright Config

**File:** `playwright.config.js`

### Global settings

```js
export default defineConfig({
    testDir: './tests',
    fullyParallel: true,               // files run in parallel across workers
    forbidOnly: !!process.env.CI,      // prevents test.only being committed
    retries: process.env.CI ? 1 : 0,  // 1 retry on CI, none locally
    workers: process.env.CI ? 2 : 2,  // browser worker cap (memory control)
    reporter: process.env.CI
        ? [['github'], ['list'], ['html']]
        : 'html',
    use: {
        baseURL: 'https://www.saucedemo.com/',
        trace: 'on-first-retry',
    },
});
```

### Projects

Six projects in total — each targets a different subset of tests:

| Project | Matches | Ignores | Auth |
|---|---|---|---|
| `setup` | `*.setup.mjs` | — | Runs login, saves sessions |
| `chromium` | All `tests/` | inventory, cart, checkout, api | None (login page tests) |
| `firefox` | All `tests/` | inventory, cart, checkout, api | None |
| `api` | `tests/api/**` | — | None (API uses tokens not sessions) |
| `chromium-authenticated` | inventory, cart, checkout | api | `storageState` per describe |
| `firefox-authenticated` | inventory, cart, checkout | api | `storageState` per describe |

**Why `testIgnore: ['**/api/**']` on authenticated projects?**

The `testMatch: ['**/cart/**']` glob on authenticated projects also matched `tests/api/cart/`. Without `testIgnore`, those API tests would be picked up by browser projects, which try to open a page and fail immediately. Adding `testIgnore` enforces the boundary explicitly.

### API project configuration

```js
{
    name: 'api',
    testMatch: ['**/tests/api/**'],
    use: {
        baseURL: 'https://fakestoreapi.com',
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
    },
}
```

No browser is launched. Tests use Playwright's `request` fixture, which is an HTTP client backed by the same engine as `page.request`. The `baseURL` is set to the API host so test files use relative paths (`/carts`, `/auth/login`).

---

## Page Object Model (UI)

Every page has a corresponding class in `pages/`. Locators and actions live in the class — test files never contain raw selectors.

### Pattern

```js
// pages/checkout.page.js
export class CheckoutPage {
    constructor(page) {
        this.page = page;
        // Step one
        this.firstNameInput  = page.locator('[data-test="firstName"]');
        this.lastNameInput   = page.locator('[data-test="lastName"]');
        this.zipCodeInput    = page.locator('[data-test="postalCode"]');
        this.continueButton  = page.locator('[data-test="continue"]');
        this.cancelButton    = page.locator('[data-test="cancel"]');
        this.errorMessage    = page.locator('[data-test="error"]');
        // Step two
        this.subtotalLabel   = page.locator('[data-test="subtotal-label"]');
        this.taxLabel        = page.locator('[data-test="tax-label"]');
        this.totalLabel      = page.locator('[data-test="total-label"]');
        this.finishButton    = page.locator('[data-test="finish"]');
        // Complete page
        this.completeHeader  = page.locator('.complete-header');
        this.ponyImage       = page.locator('[data-test="pony-express"]');
        this.backHomeButton  = page.locator('[data-test="back-to-products"]');
    }

    async gotoStepOne() { await this.page.goto('/checkout-step-one.html'); }

    async fillStepOne({ firstName, lastName, zip }) {
        if (firstName) await this.firstNameInput.fill(firstName);
        if (lastName)  await this.lastNameInput.fill(lastName);
        if (zip)       await this.zipCodeInput.fill(zip);
        await this.continueButton.click();
    }
}
```

**Why POM?** When a `data-test` attribute changes, fix it in one file — not across every test. Tests also read like user journeys rather than DOM manipulation.

---

## API Client Layer

API tests do not use page objects. Instead, thin client classes in `api/clients/` wrap Playwright's `request` fixture.

### AuthClient (`api/clients/auth.client.js`)

```js
export class AuthClient {
    constructor(request) { this.request = request; }

    async login(username, password) {
        return this.request.post('/auth/login', { data: { username, password } });
    }

    async loginEmpty() {
        return this.request.post('/auth/login', { data: {} });
    }

    async getToken(username, password) {
        const res  = await this.login(username, password);
        const body = await res.json();
        return body.token;
    }
}
```

### CartClient (`api/clients/cart.client.js`)

```js
export class CartClient {
    constructor(request) { this.request = request; }

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

**Why private `#headers()` method?** Token is optional — public endpoints work without it. The private method handles both cases without duplicating the header object in every method. Token is passed per-call rather than stored in the constructor so a single client instance can test both authenticated and unauthenticated paths.

### Usage in tests

```js
test.describe('Cart Create - POST /carts', () => {
    let token;

    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    test('positive - create cart returns 201', async ({ request }) => {
        const client = new CartClient(request);
        const res    = await client.create(cartdata.create, token);

        expect(res.status()).toBe(201);
        const body = await res.json();
        validateCartSchema(body);
    });
});
```

`test.beforeAll` is used (not `beforeEach`) because fetching a token is a shared prerequisite — there is no reason to re-fetch it for every test in the same describe block.

---

## Schema Validation

**File:** `api/schemas/cart.schema.js`

Rather than importing a schema library, validation is done with Playwright's own `expect()`. This keeps the dependency tree minimal and gives readable failure messages.

```js
import { expect } from '@playwright/test';

export function validateCartSchema(cart) {
    expect(typeof cart.id,       'cart.id must be a number').toBe('number');
    expect(typeof cart.userId,   'cart.userId must be a number').toBe('number');
    expect(Array.isArray(cart.products), 'cart.products must be an array').toBe(true);
    for (const item of cart.products) {
        expect(typeof item.productId, 'product.productId must be a number').toBe('number');
        expect(typeof item.quantity,  'product.quantity must be a number').toBe('number');
    }
}

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

Contract tests lock the API response shape to a known-good snapshot. If the API renames a field, changes a type, or drops a field, these tests fail immediately — catching breaking changes before they reach production code.

### How contracts are stored

Contracts are plain JSON files where each key maps to its expected type:

```json
// testdata/api/contracts/cart-read.contract.json
{
    "_comment": "Shape snapshot for GET and DELETE /carts responses",
    "id":       "number",
    "userId":   "number",
    "date":     "string",
    "products": { "productId": "number", "quantity": "number" },
    "__v":      "number"
}
```

**Rules:**
- `"fieldName": "number" | "string" | "boolean"` — checks `typeof actual[field]`
- `"fieldName": { ... }` — checks the field is an array, then checks the first item's shape
- Keys starting with `_` are metadata (`_comment`, `_source`) and are skipped

### Two contracts — why?

FakeStoreAPI returns different shapes for read vs mutation operations:

| Operations | Has `__v` field? | Contract file |
|---|---|---|
| GET /carts, DELETE /carts/{id} | Yes — MongoDB version key | `cart-read.contract.json` |
| POST /carts, PUT /carts/{id} | No — echoes the payload only | `cart-mutation.contract.json` |

### The assertion engine

```js
// api/schemas/contract.js
export function assertMatchesContract(actual, contract) {
    for (const [key, expected] of Object.entries(contract)) {
        if (key.startsWith('_')) continue;          // skip metadata keys

        if (typeof expected === 'object') {
            // array field — check it's an array, then check first item's shape
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

**Note:** `typeof [] === 'object'` in JavaScript, so arrays are handled by the `typeof expected === 'object'` branch with `Array.isArray()` — not by the primitive branch.

### Usage in tests

```js
import { assertMatchesContract } from '../../../api/schemas/contract.js';
import readContract     from '../../../testdata/api/contracts/cart-read.contract.json';
import mutationContract from '../../../testdata/api/contracts/cart-mutation.contract.json';

test('contract - GET /carts/{id} matches read contract', async ({ request }) => {
    const res  = await new CartClient(request).getById(1, token);
    const body = await res.json();

    expect(res.status()).toBe(200);
    assertMatchesContract(body, readContract);   // walks every field, asserts types
});

test('contract - POST /carts matches mutation contract', async ({ request }) => {
    const res  = await new CartClient(request).create(cartdata.create, token);
    const body = await res.json();

    expect(res.status()).toBe(201);
    assertMatchesContract(body, mutationContract);  // no __v expected here
});
```

---

## Locator Strategy

| Priority | Strategy | Example | When to use |
|---|---|---|---|
| 1st | `getByRole` | `page.getByRole('button', { name: 'Login' })` | Interactive elements with ARIA roles |
| 2nd | `getByTestId` | `page.getByTestId('shopping-cart-link')` | Elements with `data-test` attribute |
| 3rd | `getByPlaceholder` | `page.getByPlaceholder('Password')` | Inputs with placeholder text |
| 4th | `getByLabel` | `page.getByLabel('Username')` | Form fields with labels |
| 5th | `locator` (CSS + data-test) | `page.locator('[data-test="error"]')` | When above options don't apply |
| Last | Class selector | `page.locator('.complete-header')` | Only when no data-test or role exists |

`getByRole` is preferred because it tests accessibility semantics — a button labelled "Login" stays "Login" regardless of styling changes. Class names come last because they change with CSS refactoring.

---

## Test Structure

### UI tests — pattern

```js
import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/inventory.page.js';
import { CartPage }      from '../../pages/cart.page.js';
import { CheckoutPage }  from '../../pages/checkout.page.js';
import testdata          from '../../testdata/checkout.json';
import tags              from '../../testdata/tags.json';
import { ENV }           from '../../utils/env.js';

const { regression, P1 } = tags;
const AUTH = (user) => `playwright/.auth/${user}.json`;

test.describe('standard_user - Checkout Validation', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });

    test.beforeEach(async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        await inventoryPage.goto();
        await inventoryPage.addToCartByName(testdata.products.backpack);
        await page.goto('/checkout-step-one.html');
    });

    test('[TC_CHK_04] empty form shows First Name required error', { tag: [regression, P1] }, async ({ page }) => {
        const checkoutPage = new CheckoutPage(page);
        await checkoutPage.continueButton.click();
        await expect(checkoutPage.errorMessage).toHaveText(testdata.errors.first_name_required);
    });
});
```

**Key patterns:**
- `test.use({ storageState: AUTH(ENV.username) })` — per describe block, not global. Enables multi-user tests in the same file.
- `AUTH = (user) => \`playwright/.auth/${user}.json\`` — resolves any saved session by username.
- `beforeEach` with `({ page })` — each test gets a fresh page starting from the correct pre-condition.
- All strings from testdata JSON. All locators from page object. No hardcoded values in test files.

### API tests — pattern

```js
import { test, expect } from '@playwright/test';
import { AuthClient }       from '../../../api/clients/auth.client.js';
import { CartClient }       from '../../../api/clients/cart.client.js';
import { validateCartSchema } from '../../../api/schemas/cart.schema.js';
import authdata from '../../../testdata/api/auth.json';
import cartdata from '../../../testdata/api/cart.json';

test.describe('Cart Create - POST /carts', () => {
    let token;

    test.beforeAll(async ({ request }) => {
        token = await new AuthClient(request).getToken(authdata.valid.username, authdata.valid.password);
    });

    test('positive - create cart returns 201 with new cart object', async ({ request }) => {
        const res  = await new CartClient(request).create(cartdata.create, token);
        expect(res.status()).toBe(201);
        validateCartSchema(await res.json());
    });
});
```

### Data-driven tests

```js
const productIds = cartdata.datadriven_products; // [1, 2, 3]

for (const productId of productIds) {
    test(`create cart with productId ${productId} returns valid cart`, async ({ request }) => {
        const payload = { userId: 1, date: '2024-06-17', products: [{ productId, quantity: 1 }] };
        const res     = await new CartClient(request).create(payload, token);
        expect(res.status()).toBe(201);
        validateCartSchema(await res.json());
        expect((await res.json()).products[0].productId).toBe(productId);
    });
}
```

`for...of` with `test()` calls generates one named test per item. All three are visible as separate rows in the HTML report.

### Test naming convention

```
[TC_AUTH_01] standard_user logs in successfully
[TC_CHK_04]  empty form shows First Name required error
TC_API_01    (no brackets for API tests — no session context in the name)
```

---

## Test Data

### Separation of concerns

| Location | Contents |
|---|---|
| `testdata/*.json` | UI test data — error messages, expected labels, prices, URLs, product names |
| `testdata/api/*.json` | API test data — payloads, credentials variants, product IDs |
| `.env` | Real credentials only — never in JSON, never committed |

### Checkout test data structure (`testdata/checkout.json`)

```json
{
    "page_labels": { "step_one": "Checkout: Your Information", ... },
    "navigation": { "step_one_url": "checkout-step-one", "step_two_url": "checkout-step-two", ... },
    "form": {
        "valid":          { "firstName": "John", "lastName": "Doe", "zip": "10001" },
        "no_first_name":  { "lastName": "Doe", "zip": "10001" },
        "special_chars":  { "firstName": "<script>", "lastName": "O'Brien", "zip": "SW1A 1AA" }
    },
    "errors": { "first_name_required": "Error: First Name is required", ... },
    "products": { "backpack": "Sauce Labs Backpack", "fleece_jacket": "Sauce Labs Fleece Jacket" },
    "product_prices": { "backpack": "$29.99", "fleece_jacket": "$49.99" },
    "pricing": {
        "backpack_only": { "subtotal": "Item total: $29.99", "tax": "Tax: $2.40", "total": "Total: $32.39" },
        "backpack_and_fleece": { "subtotal": "Item total: $79.98", "tax": "Tax: $6.40", "total": "Total: $86.38" }
    },
    "complete": {
        "heading": "Thank you for your order!",
        "subtext": "Your order has been dispatched, and will arrive just as fast as the pony can get there!"
    }
}
```

### API test data structure (`testdata/api/cart.json`)

```json
{
    "existing_cart_id": 1,
    "nonexistent_cart_id": 99999,
    "create": { "userId": 1, "date": "2024-06-17", "products": [{ "productId": 5, "quantity": 1 }] },
    "create_multi_product": { "userId": 2, "date": "2024-06-17", "products": [{ "productId": 1, "quantity": 2 }, { "productId": 3, "quantity": 1 }] },
    "update": { "userId": 1, "date": "2024-06-17", "products": [{ "productId": 7, "quantity": 3 }] },
    "datadriven_products": [1, 2, 3]
}
```

---

## Environment Variables

**File:** `.env` (gitignored — never committed)

```ini
STANDARD_USER=standard_user
LOCKED_OUT_USER=locked_out_user
PROBLEM_USER=problem_user
PERFORMANCE_GLITCH_USER=performance_glitch_user
ERROR_USER=error_user
VISUAL_USER=visual_user
PASSWORD=secret_sauce
```

**File:** `utils/env.js` — single place where `process.env` is read

```js
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    password:                process.env.PASSWORD,
    standard_user:           process.env.STANDARD_USER,
    locked_out_user:         process.env.LOCKED_OUT_USER,
    problem_user:            process.env.PROBLEM_USER,
    performance_glitch_user: process.env.PERFORMANCE_GLITCH_USER,
    error_user:              process.env.ERROR_USER,
    visual_user:             process.env.VISUAL_USER,
};
```

**Why `utils/env.js` instead of `process.env` directly in tests?** If a variable is renamed in `.env`, update it in one file. Without this layer you'd `grep` across every test file.

---

## Tagging Strategy

Tags are defined in `testdata/tags.json` and imported into test files — no string literals scattered in tests.

```js
import tags from '../../testdata/tags.json';
const { smoke, regression, P1, P2 } = tags;

test('[TC_CHK_04] ...', { tag: [regression, P1] }, async ({ page }) => { ... });
```

| Tag | Purpose |
|---|---|
| `@smoke` | Critical path — run before every deployment |
| `@regression` | Full suite — run on PRs and nightly |
| `@P1` | Must pass before release |
| `@P2` | High priority |
| `@P3` | Lower priority |

```bash
npm run test:smoke                          # @smoke tests
npm run test:regression                     # @regression tests
npx playwright test --grep @P1             # P1 tests
npx playwright test --grep "@smoke|@P1"    # smoke OR P1
npx playwright test --grep-invert @P3      # exclude P3
```

---

## Parallelism and Memory Management

### Two levels of parallelism

**Level 1 — File level** (`fullyParallel: true`)
Each file is an independent worker. All files run simultaneously. Automatic — no code needed.

**Level 2 — Describe level** (`test.describe.configure`)
Controls how tests run *within* a file.

```js
// Independent tests — run simultaneously
test.describe.configure({ mode: 'parallel' });

// State-sensitive tests — run one after another
test.describe.configure({ mode: 'serial' });
```

### Workers cap

```js
workers: process.env.CI ? 2 : 2
```

CI gets 2 workers to avoid OOM on GitHub Actions runners. API tests are lightweight (no browser) but share the same worker pool — the cap is per project run, not per test type.

### Why split into focused files?

One large file with many parallel tests exhausts memory. Each file = one worker. Splitting by concern (validation, navigation, summary, complete) keeps each worker lean and makes failure diagnosis obvious.

---

## Session and Auth Setup

### The problem

Feature tests (inventory, cart, checkout) all need to start logged in. Repeating UI login steps across 70+ tests is slow and adds server load.

### The solution — per-user `storageState`

`tests/utils/auth.setup.mjs` logs in as each user type and saves the session:

```js
import { test as setup } from '@playwright/test';
import { ENV } from '../../utils/env.js';

const AUTH = (user) => `playwright/.auth/${user}.json`;

for (const [key, username] of Object.entries({
    standard_user:           ENV.standard_user,
    visual_user:             ENV.visual_user,
    error_user:              ENV.error_user,
    problem_user:            ENV.problem_user,
    performance_glitch_user: ENV.performance_glitch_user,
})) {
    setup(`authenticate as ${username}`, async ({ page }) => {
        await page.goto('/');
        await page.fill('[data-test="username"]', username);
        await page.fill('[data-test="password"]', ENV.password);
        await page.click('[data-test="login-button"]');
        await page.waitForURL(/inventory/);
        await page.context().storageState({ path: AUTH(username) });
    });
}
```

**Feature tests load the saved session per describe block:**

```js
const AUTH = (user) => `playwright/.auth/${user}.json`;

test.describe('standard_user checkout', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });
    // all tests here start already logged in as standard_user
});

test.describe('error_user checkout', () => {
    test.use({ storageState: AUTH(ENV.error_user) });
    // same file, different session
});
```

**Why per describe block instead of per project?**
Multiple user types need to be tested in the same test file (e.g. `checkout.ui.test.js` tests standard_user, visual_user, and error_user). Setting `storageState` at project level would lock the entire project to one user. Putting it in each `describe` block gives per-suite control.

**Why auth tests do NOT use `storageState`?**
Auth tests test the login page itself — they must start logged out. Adding `storageState` would bypass the login flow and break these tests.

---

## Projects Overview

```js
projects: [
    // Saves per-user sessions to playwright/.auth/*.json
    { name: 'setup', testMatch: /.*\.setup\.mjs/ },

    // Auth tests — no session, tests the login page
    {
        name: 'chromium',
        testIgnore: ['**/inventory/**', '**/cart/**', '**/checkout/**', '**/api/**'],
        use: { ...devices['Desktop Chrome'], headless: true, screenshot: 'only-on-failure', video: 'on-first-retry' },
    },
    {
        name: 'firefox',
        testIgnore: ['**/inventory/**', '**/cart/**', '**/checkout/**', '**/api/**'],
        use: { ...devices['Desktop Firefox'], headless: true, screenshot: 'only-on-failure', video: 'on-first-retry' },
    },

    // REST API tests — no browser launched
    {
        name: 'api',
        testMatch: ['**/tests/api/**'],
        use: {
            baseURL: 'https://fakestoreapi.com',
            extraHTTPHeaders: { 'Content-Type': 'application/json' },
        },
    },

    // Feature UI tests — per-user sessions, Chrome and Firefox
    {
        name: 'chromium-authenticated',
        testMatch: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
        testIgnore: ['**/api/**'],
        use: { ...devices['Desktop Chrome'], headless: true, screenshot: 'only-on-failure', video: 'on-first-retry' },
        dependencies: ['setup'],
    },
    {
        name: 'firefox-authenticated',
        testMatch: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
        testIgnore: ['**/api/**'],
        use: { ...devices['Desktop Firefox'], headless: true, screenshot: 'only-on-failure', video: 'on-first-retry' },
        dependencies: ['setup'],
    },
]
```

---

## Debugging

### View trace after a failure

```bash
npx playwright show-trace test-results/.../trace.zip
```

Or open the HTML report — it embeds the trace viewer:

```bash
npm run test:report
```

### Run in headed mode

```bash
npx playwright test --headed
```

### Step through a test

```bash
npx playwright test --debug
```

### Inspect a specific failure

```bash
npx playwright test --grep "TC_CHK_18" --headed --project=chromium-authenticated
```

---

## CI/CD

**File:** `.github/workflows/playwright.yml`

Runs on every push and PR to `main` / `master`.

```yaml
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/* }
      - uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ hashFiles('package-lock.json') }}
      - run: npm ci
      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

**Key CI settings:**
- `workers: 2` — prevents OOM on GitHub Actions 2-core runners
- `retries: 1` — one retry per failed test to catch genuine flakiness
- `forbidOnly: true` — build fails if `test.only` is accidentally committed
- Reporters: `github` (PR annotations) + `list` (live log) + `html` (artifact)

---

## Adding New Tests

### New API endpoint

1. Add payload/ID to `testdata/api/cart.json` (or create a new testdata file)
2. Add a method to the relevant client class in `api/clients/`
3. Create a test file in `tests/api/<resource>/`
4. If a new resource schema is needed, add a validator in `api/schemas/`

### New UI test in an existing suite

1. Add test data to the relevant `testdata/*.json`
2. If a new locator is needed, add it to the page class in `pages/`
3. Add a `test()` block in the appropriate file under `tests/<feature>/`

### New feature area (e.g. profile page)

1. Create `pages/profile.page.js` with locators and actions
2. Create `tests/profile/` with focused test files
3. Add `**/profile/**` to `testMatch` in authenticated projects
4. Add `**/profile/**` to `testIgnore` in non-authenticated projects
5. Tests start already logged in — no login steps needed

### New user type to test

1. Add user to `.env` and `utils/env.js`
2. Add setup block in `tests/utils/auth.setup.mjs`
3. Use `test.use({ storageState: AUTH(ENV.new_user) })` in the describe block that tests that user
