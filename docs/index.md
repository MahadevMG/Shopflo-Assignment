# Shopflo E2E Test Framework

**Playwright · Node.js · GitHub Actions · Page Object Model · REST API Testing**

End-to-end UI automation (Assignment 1) and REST API test suite (Assignment 2) for [Swag Labs](https://www.saucedemo.com) and [FakeStore API](https://fakestoreapi.com), built entirely with Playwright.

[View on GitHub](https://github.com/MahadevMG/Shopflo-Assignment) · [Test Coverage](#test-coverage) · [API Test Suite](#assignment-2--rest-api-testing) · [Decisions](#decisions)

---

## The Goal

Build a scalable, maintainable test framework that:
- Covers the full Swag Labs user journey (auth → inventory → cart → checkout) across all user types
- Tests the FakeStore REST API (CRUD, auth, schema validation, data-driven scenarios) without introducing a second tool
- Runs reliably on CI with zero manual steps
- Is readable and extensible by anyone joining the project

---

## Why Playwright

Three frameworks were evaluated: **Selenium**, **WebdriverIO**, and **Playwright**.

| Criterion | Selenium | WebdriverIO | Playwright |
|---|---|---|---|
| Driver management | Manual | Manual | Automatic |
| Auto-waiting | No | Partial | Yes — all locators |
| Built-in test runner | No | Yes | Yes |
| Built-in parallelism | No (Grid) | Partial | Yes |
| Session reuse | No | Complex | Built-in (`storageState`) |
| Trace / debug viewer | No | No | Yes |
| GitHub Actions integration | No | No | Built-in reporter |
| API testing | No | Plugin | First-class `request` fixture |
| Setup time | High | Medium | Low |

**Why I went with Playwright:**

- **Configuration in one place** — everything is in `playwright.config.js`. Projects, browsers, base URLs, reporters, retries. Easy to change and hand off to someone else.
- **Codegen** — can record browser actions and generate test code. Useful for quickly scaffolding locators on a new page.
- **Cross browser, cross platform** — Chromium, Firefox, WebKit out of the box with no extra setup.
- **Built-in `expect()`** — no separate assertion library needed. The same `expect()` works for UI checks, API responses, and schema validation. Big win.
- **Tracing** — the trace viewer lets you replay the full test run with every action, DOM snapshot, and network call. One thing WebdriverIO did better was log level config (`info`, `error`, `debug`) — Playwright is less flexible there.
- **Multiple tab handling** — much cleaner than Selenium or WebdriverIO.
- **`storageState` for sessions** — log in once per user, save to a file, every test loads it. WebdriverIO has something similar but Playwright's implementation is more stable and better documented. Eliminated ~70 redundant login flows.
- **Locator strategy** — `getByRole`, `getByLabel`, `getByPlaceholder` are more readable than WebdriverIO's equivalent. You can tell what an element is just from the locator name.

---

## Architecture

### Full project structure

```
Shopflo-Assignment/
│
├── pages/                           # Page Object Model (UI)
│   ├── login.page.js
│   ├── inventory.page.js
│   ├── cart.page.js
│   └── checkout.page.js
│
├── api/                             # API layer (Assignment 2)
│   ├── clients/
│   │   ├── auth.client.js           # POST /auth/login
│   │   └── cart.client.js           # Cart CRUD
│   └── schemas/
│       ├── cart.schema.js           # Schema validators
│       └── contract.js              # Contract / snapshot assertion engine
│
├── tests/
│   ├── auth/                        # Login / session UI tests
│   ├── inventory/                   # Product listing and sort UI tests
│   ├── cart/                        # Cart UI tests
│   ├── checkout/                    # Full checkout flow UI tests
│   ├── api/
│   │   ├── auth/post.auth.test.js   # POST /auth/login (5 tests)
│   │   └── cart/
│   │       ├── get.cart.test.js          # GET /carts (6 tests)
│   │       ├── post.cart.test.js         # POST /carts (6 tests)
│   │       ├── put.cart.test.js          # PUT /carts/{id} (5 tests)
│   │       ├── delete.cart.test.js       # DELETE /carts/{id} (5 tests)
│   │       ├── cart.datadriven.test.js   # 3 product IDs, same flow
│   │       └── cart.contract.test.js     # Contract / snapshot tests (5 tests)
│   └── utils/auth.setup.mjs         # Per-user session setup
│
├── testdata/
│   ├── login.json / inventory.json / cart.json / checkout.json / tags.json
│   └── api/
│       ├── auth.json                # FakeStoreAPI credential variants
│       ├── cart.json                # Payloads, IDs, data-driven seeds
│       └── contracts/
│           ├── cart-read.contract.json     # Shape snapshot for GET + DELETE
│           └── cart-mutation.contract.json # Shape snapshot for POST + PUT
│
├── utils/env.js                     # Centralised ENV object
├── playwright/.auth/                # Session files per user (gitignored)
└── playwright.config.js             # All configuration
```

### Page Object Model (UI)

```js
// pages/checkout.page.js
export class CheckoutPage {
    constructor(page) {
        this.firstNameInput = page.locator('[data-test="firstName"]');
        this.continueButton = page.locator('[data-test="continue"]');
        this.subtotalLabel  = page.locator('[data-test="subtotal-label"]');
        this.finishButton   = page.locator('[data-test="finish"]');
        this.completeHeader = page.locator('.complete-header');
        this.ponyImage      = page.locator('[data-test="pony-express"]');
    }
    async fillStepOne({ firstName, lastName, zip }) { ... }
}
```

Every page has a class in `pages/`. Test files never contain raw selectors. When a `data-test` attribute changes, fix it in one file.

### API Client Layer

```js
// api/clients/cart.client.js
export class CartClient {
    constructor(request) { this.request = request; }
    #headers(token) { return token ? { Authorization: `Bearer ${token}` } : {}; }
    async create(payload, token) {
        return this.request.post('/carts', { data: payload, headers: this.#headers(token) });
    }
}
```

Thin wrappers around Playwright's `request` fixture. Token is passed per-call, not stored — one client instance can test both authenticated and unauthenticated paths.

---

## Playwright Config — Six Projects

```
setup                    → runs auth.setup.mjs, saves per-user sessions
chromium                 → auth UI tests (no session)
firefox                  → auth UI tests (no session)
api                      → REST API tests (no browser, baseURL = fakestoreapi.com)
chromium-authenticated   → feature UI tests with per-user storageState
firefox-authenticated    → feature UI tests with per-user storageState
```

The `api` project:
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

No browser is launched. Tests use the `request` fixture exclusively.

---

## Key Challenges and How They Were Solved

### Challenge 1 — Memory exhaustion from parallel tests

**Problem:** Running many tests in a single file with `fullyParallel: true` spun up too many browser instances simultaneously, exhausting memory on CI.

**Solution:** Split tests into focused files by concern. Each file is one worker. Checkout alone is split into 7 files (ui, validation, navigation, summary, complete, edge, e2e).

```
checkout.ui.test.js         → worker A  (3 tests)
checkout.validation.test.js → worker B  (6 tests)
checkout.navigation.test.js → worker C  (6 tests)
checkout.summary.test.js    → worker D  (7 tests)
checkout.complete.test.js   → worker E  (5 tests)
checkout.edge.test.js       → worker F  (2 tests)
checkout.e2e.test.js        → worker G  (1 test)
```

### Challenge 2 — Per-user session handling

**Problem:** Swag Labs has six user types with different behaviour (standard, locked out, error, visual, problem, performance_glitch). Feature tests need to cover multiple users — sometimes in the same file.

**Solution:** `storageState` per describe block. Each user type gets its own session file. The `AUTH` helper resolves the path by username.

```js
const AUTH = (user) => `playwright/.auth/${user}.json`;

test.describe('standard_user checkout', () => {
    test.use({ storageState: AUTH(ENV.standard_user) });
    // tests here start logged in as standard_user
});

test.describe('error_user checkout', () => {
    test.use({ storageState: AUTH(ENV.error_user) });
    // same file, different session
});
```

Setting `storageState` at project level would lock the entire project to one user — impossible for cross-user files.

### Challenge 3 — API tests bleeding into authenticated UI projects

**Problem:** `testMatch: ['**/cart/**']` on `chromium-authenticated` and `firefox-authenticated` also matched `tests/api/cart/`. Those API tests were being picked up by browser projects, which launched a browser and immediately failed.

**Solution:** Added `testIgnore: ['**/api/**']` to both authenticated projects. The boundary is now explicit — adding a new feature folder requires one line in `testMatch` and one in `testIgnore`.

### Challenge 4 — Checkout complete page locators

**Problem:** The test plan referenced a pony image locator, but the actual `data-test` attribute on the page was unknown before the page was loaded. Using a wrong locator would cause a timeout failure that masked the real assertion.

**Solution:** Navigated to the complete page programmatically using a Node.js script to extract all `data-test` attributes before writing a single test. Found: `pony-express`, `complete-header`, `complete-text`, `back-to-products`. Added all four to `CheckoutPage` with the correct attribute names.


### Challenge 6 — Credentials in source control

**Problem:** Test files need usernames and passwords. Putting them in JSON or directly in test files risks committing them to git.

**Solution:** Three-layer separation:
- `.env` — real credentials, gitignored, never committed
- `utils/env.js` — single place that reads `process.env`; all test files import from here
- `testdata/*.json` — non-sensitive data only (error messages, expected texts, prices)

On CI, each `.env` variable is stored as a GitHub repository secret and injected at runtime.

### Challenge 7 — Bug tests in the report

**Problem:** The test plan includes known bugs (visual_user shows scrambled prices, error_user blocks form fields). How should these appear in the report?

**Solution:** Tests assert the *correct* expected behaviour. They fail naturally when the bug is present — no `test.fail()`. This means:
- The report clearly shows the bug as a failing test
- When the bug is fixed, the test goes green automatically
- No misleading "passing" tests that only pass because a bug exists

---

## Assignment 1 — UI Test Coverage

### Authentication (`tests/auth/`)

| File | Tests | Mode |
|---|---|---|
| `login.valid.test.js` | TC_AUTH_01, 12, 13, 14 — all user types log in | Parallel |
| `login.invalid.test.js` | TC_AUTH_02–06 — empty fields, wrong credentials | Parallel |
| `login.error-banner.test.js` | TC_AUTH_07 — locked out, banner dismiss | — |
| `login.session.test.js` | TC_AUTH_17, 18, 20 — logout, back button, direct URL | Serial |
| `login.ui.test.js` | TC_AUTH_15 — password field masking | — |

### Inventory (`tests/inventory/`)

Covers product display, sort order (A-Z, Z-A, price low→high, price high→low), add-to-cart from inventory, cart badge count updates, product detail page navigation, and navigation menu.

### Cart (`tests/cart/`)

Covers adding items, removing items, quantity persistence, cart total, and navigating to checkout.

### Checkout (`tests/checkout/`)

| File | Test Cases | What it covers |
|---|---|---|
| `checkout.ui.test.js` | TC_CHK_01–03 | Form layout per user type (standard, visual, error) |
| `checkout.validation.test.js` | TC_CHK_04–09 | Required field validation, error_user bypass bug |
| `checkout.navigation.test.js` | TC_CHK_10–11, 19–21, 26 | Cancel/continue flow, back button behaviour |
| `checkout.summary.test.js` | TC_CHK_12–18 | Step two prices, payment/shipping info, error_user bypass |
| `checkout.complete.test.js` | TC_CHK_22–25, 27 | Confirmation page, visual_user price bug |
| `checkout.edge.test.js` | TC_CHK_28–29 | XSS in name field, invalid zip accepted |
| `checkout.e2e.test.js` | TC_CHK_32 | Full happy path — add → cart → checkout → confirm |

---

## Assignment 2 — REST API Testing

Target: [FakeStore API](https://fakestoreapi.com)

### Why the same Playwright project

- Same test runner → unified HTML report (UI + API in one view)
- Same `request` fixture → no new HTTP client to learn
- Same `expect()` → consistent assertion syntax for schema validation
- Zero new dependencies — `@playwright/test` already ships everything needed
- Isolated `api` project in config → separate `baseURL`, no browser launched

### API Test Suites

| Suite | File | Count | What it covers |
|---|---|---|---|
| Auth | `auth/post.auth.test.js` | 5 | Login positive/negative, error message body, schema |
| Cart Read | `cart/get.cart.test.js` | 6 | GET all, GET by id, schema, nonexistent→null, no-auth |
| Cart Create | `cart/post.cart.test.js` | 6 | POST 201, userId/products reflect, multi-product, schema, no-auth |
| Cart Update | `cart/put.cart.test.js` | 5 | PUT 200, userId/products reflect, schema, upsert on nonexistent |
| Cart Delete | `cart/delete.cart.test.js` | 5 | DELETE 200, returns deleted cart, schema, nonexistent→null, no-auth |
| Data-driven | `cart/cart.datadriven.test.js` | 3 | Same create flow over productIds 1, 2, 3 |
| Contract | `cart/cart.contract.test.js` | 5 | Response shape snapshot for all CRUD operations |

**Total: 35 API tests**


### Data-driven test pattern

```js
const productIds = cartdata.datadriven_products; // [1, 2, 3]

for (const productId of productIds) {
    test(`create cart with productId ${productId} returns valid cart`, async ({ request }) => {
        const res = await new CartClient(request).create(
            { userId: 1, date: '2024-06-17', products: [{ productId, quantity: 1 }] },
            token
        );
        expect(res.status()).toBe(201);
        validateCartSchema(await res.json());
    });
}
```

`for...of` with `test()` calls generates three named tests — all visible as separate rows in the HTML report, each run independently.

### Schema validation

```js
// api/schemas/cart.schema.js
export function validateCartSchema(cart) {
    expect(typeof cart.id,     'cart.id must be a number').toBe('number');
    expect(typeof cart.userId, 'cart.userId must be a number').toBe('number');
    expect(Array.isArray(cart.products)).toBe(true);
    for (const item of cart.products) {
        expect(typeof item.productId, 'product.productId must be a number').toBe('number');
        expect(typeof item.quantity,  'product.quantity must be a number').toBe('number');
    }
}
```

No AJV, no JSON Schema library — plain `expect()` with readable failure messages.

---

## CI/CD Pipeline

```
Push to master / PR targeting master
            ↓
  Restore node_modules cache
            ↓
  Restore Playwright browser cache (keyed on package-lock.json hash)
            ↓
  npm ci (clean install)
            ↓
  playwright install --with-deps (only on cache miss)
            ↓
         Run all tests
            ↓
   ┌────────────────────────┐
   │ github reporter        │ → inline PR annotations
   │ list reporter          │ → live log in Actions
   │ html reporter          │ → artifact (30 day retention)
   └────────────────────────┘
            ↓
  Deploy HTML report to GitHub Pages (master only)
```

Secrets are never in the codebase. Each `.env` variable is a GitHub repository secret injected at runtime.

---

## Decisions

This explains why I made certain choices in this project. Not just what I did, but why I did it that way.

### Why I used Playwright for API tests too

For Assignment 2, I needed to test the FakeStoreAPI REST endpoints. I could have used Postman, axios, or the native Node.js `fetch`. But I decided to reuse Playwright instead.

- I can reuse the existing infrastructure - same config, same runner, same folder structure. No need to set up anything from scratch.
- All 35 API tests show up in the same HTML report as the UI tests. One command runs everything. One artifact on CI.
- Playwright's `request` fixture is a proper HTTP client. It handles headers, JSON bodies, response parsing - everything I need.
- I use the same `expect()` for API assertions as I do in UI tests. No new syntax to learn or explain.
- Zero new packages. `@playwright/test` already has everything.
- I set up a separate `api` project in `playwright.config.js` with its own `baseURL` pointing to FakeStoreAPI. Browser projects never touch API test files.

### Other decisions I made

**Page Object Model** - I put all locators and page actions in `pages/` classes. Test files don't have any raw selectors. When a `data-test` attribute changes, I fix it in one place instead of hunting through every test file.

**Test data in JSON, credentials in `.env`** - Expected strings, prices, error messages go in `testdata/*.json`. Real credentials only go in `.env` which is gitignored. On CI, secrets are injected from GitHub repository secrets.

**Split tests across focused files** - Instead of one large file per feature, I split by concern - validation, navigation, summary, complete. Each file is its own worker. Keeps memory low and makes it obvious which file to look at when something fails.

**`storageState` per describe block, not per project** - Some files test multiple user types in the same file. If I set it globally I can only test one user per project run. Putting it per describe block gives full control.

**Per-user session files** - Each user gets their own session file. Different users behave differently - error_user blocks actions, visual_user shows wrong prices. A single shared session wouldn't work.

**`testIgnore` on authenticated projects** - Without it, `testMatch: ['**/cart/**']` also picked up `tests/api/cart/`. Those API tests ran inside a browser project and failed with a confusing error. `testIgnore` makes the boundary explicit.

**API clients take `request` as constructor argument** - Keeps each test's HTTP context isolated. Two parallel tests each get their own client and their own `request`. Storing it globally would break parallel runs.

**Schema validation without a library** - `expect(typeof cart.id).toBe('number')` instead of AJV or JSON Schema. No extra dependency, same syntax as everything else, readable failure messages.

**Two contract files for snapshot tests** - GET and DELETE responses include a `__v` field (MongoDB version key). POST and PUT don't - they echo back what was sent. So two contracts: `cart-read.contract.json` for GET + DELETE, `cart-mutation.contract.json` for POST + PUT.

**Bug tests fail naturally** - Tests assert the correct expected behaviour and fail when the bug is present. No `test.fail()` which would make the test pass when the bug exists and hide it in the report.

**Serial mode for session tests** - `login.session.test.js` runs in serial mode. Session tests share browser state - running them in parallel causes race conditions.

---

## What I Would Add Next

| Area | Status | Notes |
|---|---|---|
| Auth tests (UI) | Done | 14 tests |
| Inventory tests | Done | Sort, display, cart badge, navigation |
| Cart tests | Done | Add, remove, quantity |
| Checkout tests | Done | 32 tests - validation to E2E |
| API tests - Auth | Done | POST /auth/login |
| API tests - Cart CRUD | Done | GET, POST, PUT, DELETE |
| API tests - Data-driven | Done | 3 product IDs |
| API tests - Contract | Done | Snapshot tests for all CRUD responses |
| Visual regression | Not started | Would use Percy |
| Performance testing | Not started | Would use k6 separately |
| Sharding on CI | Not started | Worth adding once suite takes more than 10 minutes |
| Allure reporting | Not started | Useful when historical trend data is needed |

**1. Use APIs to set up preconditions instead of UI steps** - If a test needs 2 items in the cart, use the API to add them directly instead of going through the UI. Faster, more reliable, and the test stays focused on what it is actually validating.

**2. Self-hosted runners on GitHub Actions** - GitHub's default runners only give 2 cores so workers are capped at 2. Self-hosted machines with more cores would allow more parallel workers and cut total suite time.

**3. Parallelism at multiple levels** - Right now parallelism is at the file level. More can be done: suite level (UI and API as separate CI jobs), folder level (sharding auth/inventory/cart/checkout across machines), test level (parallel mode within a file where tests are independent), project level (chromium-authenticated and firefox-authenticated as separate CI jobs). As the suite grows the total run time stays flat instead of growing linearly.

**4. AI agent / skill for test automation** - An AI agent that can generate test cases, scaffold new page objects, and identify missing coverage. Reduces manual effort and speeds up adding tests for new features.

**5. Docker containers for environment consistency** - If environment setup becomes an issue across machines or CI, wrapping the test run in Docker would make it consistent everywhere. Same container locally and on CI, no environment-specific failures.

---

## Locator Strategy

| Priority | Strategy | Example |
|---|---|---|
| 1st | `getByRole` | `page.getByRole('button', { name: 'Login' })` |
| 2nd | `getByTestId` | `page.getByTestId('shopping-cart-link')` |
| 3rd | `getByPlaceholder` | `page.getByPlaceholder('Password')` |
| 4th | `getByLabel` | `page.getByLabel('Username')` |
| 5th | CSS with `data-test` | `page.locator('[data-test="error"]')` |
| Last | Class selector | `page.locator('.complete-header')` |

`getByRole` is preferred — it tests accessibility semantics and is resilient to styling changes. Class names are last — they change with CSS refactoring.

---

*Built by [Mahadev](https://github.com/MahadevMG) · [View source](https://github.com/MahadevMG/Shopflo-Assignment) · Last updated: 2026-06-17*
