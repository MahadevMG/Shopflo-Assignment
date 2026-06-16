# Playwright Test Framework

## Table of Contents
- [Folder Structure](#folder-structure)
- [NPM Scripts](#npm-scripts)
- [Playwright Config](#playwright-config)
- [Page Object Model](#page-object-model)
- [Locator Strategy](#locator-strategy)
- [Test Structure](#test-structure)
- [Test Data](#test-data-loginjson)
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
├── pages/                               # Page Object Model classes
│   ├── login.page.js                    # Login page — locators + actions
│   └── inventory.page.js                # Inventory page — locators + actions
│
├── tests/                               # All test files organised by feature
│   └── auth/
│       ├── login.valid.test.js          # TC_AUTH_01, 12, 13, 14 — successful logins
│       ├── login.invalid.test.js        # TC_AUTH_02–06 — validation error messages
│       ├── login.error-banner.test.js   # TC_AUTH_07 — locked out user + banner dismiss
│       ├── login.session.test.js        # TC_AUTH_17, 18, 20 — logout and session handling
│       └── login.ui.test.js             # TC_AUTH_15 — password field masking
│
├── testdata/                            # Non-sensitive test data only
│   └── login.json                       # Error messages, expected texts, invalid credentials, tags
│
├── utils/                               # Shared utilities used across tests
│   ├── env.js                           # Centralised ENV object — wraps all process.env calls
│   └── auth.setup.js                    # Logs in once and saves session for feature tests
│
├── playwright/.auth/                    # Auto-generated browser session files (gitignored)
│   └── user.json                        # Created by auth.setup.js — contains cookies/localStorage
│
├── .github/
│   └── workflows/
│       └── playwright.yml               # GitHub Actions CI pipeline
│
├── .env                                 # Real credentials — never commit (gitignored)
├── .gitignore                           # Excludes .env, node_modules, playwright/.auth etc.
├── playwright.config.js                 # All Playwright configuration
├── package.json                         # NPM scripts and dependencies
└── Framework.md                         # This file
```

**Why one file per concern under `tests/auth/`?**
A single file with 14 tests all running in parallel can exhaust memory. Splitting by concern means each file runs as its own worker — better isolation, faster failure feedback, and easier to debug when one suite fails.

---

## NPM Scripts

Defined in `package.json`. Always use these instead of running `npx playwright test` directly so the right flags are applied consistently.

| Script | Command | When to use |
|---|---|---|
| `npm test` | `playwright test` | Full suite — all projects |
| `npm run test:auth` | `playwright test --project=chromium --project=firefox` | Auth tests on both browsers |
| `npm run test:auth:chrome` | `playwright test --project=chromium` | Auth tests on Chromium only |
| `npm run test:auth:firefox` | `playwright test --project=firefox` | Auth tests on Firefox only |
| `npm run test:features` | `playwright test --project=chromium-authenticated --project=firefox-authenticated` | Feature tests on both browsers (runs setup first) |
| `npm run test:features:chrome` | `playwright test --project=chromium-authenticated` | Feature tests on Chromium only |
| `npm run test:features:firefox` | `playwright test --project=firefox-authenticated` | Feature tests on Firefox only |
| `npm run test:smoke` | `playwright test --grep @smoke` | Quick confidence check — P1 smoke cases |
| `npm run test:regression` | `playwright test --grep @regression` | Full regression suite |
| `npm run test:report` | `playwright show-report` | Opens last HTML report in browser |

You can also combine flags:
```bash
# Run only P1 smoke tests on a specific file
npx playwright test tests/auth/valid-login.test.js --grep @smoke

# Run a single test by title
npx playwright test --grep "TC_AUTH_01"

# Run in headed mode to watch the browser
npx playwright test --headed

# Run in debug mode — pauses at each step
npx playwright test --debug
```

---

## Playwright Config

**File:** `playwright.config.js`

```js
export default defineConfig({
    testDir: './tests',       // where Playwright looks for test files
    fullyParallel: true,      // test files run in parallel across workers
    forbidOnly: !!process.env.CI, // prevents test.only from being committed
    retries: process.env.CI ? 1 : 0, // 1 retry on CI to catch flaky tests, none locally
    workers: process.env.CI ? 2 : 4, // caps parallel browser instances (memory control)
    reporter: 'html',         // generates a visual HTML report after each run

    use: {
        baseURL: 'https://www.saucedemo.com/', // page.goto('/') resolves to this
        trace: 'on-first-retry',      // records a trace only when a test is retried
        screenshot: 'only-on-failure', // captures screenshot only when test fails
        video: 'on-first-retry',       // records video only on retry (not every run)
    },
});
```

**Why `trace: 'on-first-retry'` and not `trace: 'on'`?**
Recording traces for every test creates large files and slows down the run. Capturing only on retry means you get a trace exactly when a test starts failing — which is when you need it.

**Why `workers: process.env.CI ? 2 : 4` and not unlimited?**
Without a cap, Playwright can spin up as many workers as CPU cores. On CI (typically 2 cores) this causes memory exhaustion. Locally 4 workers gives a good speed/memory balance.

---

## Page Object Model

Every page of the application has a corresponding class in `pages/`. Locators and actions live in the class — test files never contain raw selectors.

**Why POM?**
When a selector changes (e.g. a `data-test` attribute is renamed), you fix it in one file instead of hunting through every test. Tests also become easier to read — `loginPage.login(user, pass)` is clearer than repeated `fill` and `click` calls.

### LoginPage (`pages/login.page.js`)

```js
export class LoginPage {
    constructor(page) {
        this.page = page;

        this.usernameInput       = page.getByRole('textbox', { name: 'Username' });
        this.passwordInput       = page.getByPlaceholder('Password');
        this.loginButton         = page.getByRole('button', { name: 'Login' });
        this.errorMessage        = page.locator('[data-test="error"]');
        this.errorBannerCloseBtn = page.locator('.error-button');
        this.usernameErrorIcon   = page.locator('#user-name ~ svg.error_icon');
        this.passwordErrorIcon   = page.locator('#password ~ svg.error_icon');
    }

    async goto()                     { await this.page.goto('/'); }
    async login(username, password)  { /* fill username, password, click login */ }
    async getErrorMessage()          { return await this.errorMessage.textContent(); }
    async closeErrorMessageBanner()  { await this.errorBannerCloseBtn.click(); }
}
```

### InventoryPage (`pages/inventory.page.js`)

```js
export class InventoryPage {
    constructor(page) {
        this.page = page;

        this.shoppingCartIcon = page.locator('[data-test="shopping-cart-link"]');
        this.inventoryList    = page.locator('[data-test="inventory-list"]');
        this.menuButton       = page.getByRole('button', { name: 'Open Menu' });
        this.logoutLink       = page.getByRole('link',   { name: 'Logout' });
    }

    async logout() {
        await this.menuButton.click();   // open hamburger menu
        await this.logoutLink.click();   // click Logout link
    }
}
```

---

## Locator Strategy

Playwright provides multiple ways to find elements. This framework follows a priority order:

| Priority | Strategy | Example | When to use |
|---|---|---|---|
| 1st | `getByRole` | `page.getByRole('button', { name: 'Login' })` | Interactive elements with ARIA roles |
| 2nd | `getByTestId` | `page.getByTestId('shopping-cart-link')` | Elements with `data-test` attribute |
| 3rd | `getByPlaceholder` | `page.getByPlaceholder('Password')` | Input fields with placeholder text |
| 4th | `getByLabel` | `page.getByLabel('Username')` | Form fields with labels |
| 5th | `locator` (CSS) | `page.locator('[data-test="error"]')` | When above options don't apply |
| Last | Class selector | `page.locator('.error-button')` | Only when no `data-test` or role exists |

**Why this order?**
`getByRole` and `getByTestId` are resilient to UI changes — a button labelled "Login" stays "Login" regardless of styling changes. Class names often change with CSS refactoring. `data-test` attributes exist specifically for testing and rarely change.

---

## Test Structure

Every test file follows the same pattern:

```js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { InventoryPage } from '../../pages/inventory.page';
import testdata from '../../testdata/login.json';
import { ENV } from '../../utils/env.js';

// Destructure tags once — used as { tag: [smoke, P1] } in each test
const { smoke, regression, P1, P2, P3 } = testdata.tags;

test.describe("Valid Login", () => {
    test.describe.configure({ mode: 'parallel' }); // or 'serial' for session tests

    let loginPage;
    let inventoryPage;

    // Runs before every test — fresh page state guaranteed
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        await loginPage.goto();
    });

    test("[TC_AUTH_01] standard_user logs in successfully", { tag: [smoke, P1] }, async ({ page }) => {
        await loginPage.login(ENV.standard_user, ENV.password);

        await expect(page).toHaveURL(/inventory/);
        await expect(page).toHaveTitle(testdata.expected_texts.swag_labs_title);
        await expect(inventoryPage.shoppingCartIcon).toBeVisible();
        await expect(inventoryPage.inventoryList).toBeVisible();
    });
});
```

**Why `beforeEach` instead of `before`?**
`beforeEach` gives every test a clean starting point — the login page fresh. If tests shared state via `before`, a failure in one test could corrupt state for the next.

**Why `let` for page objects instead of declaring in beforeEach?**
Declaring `let loginPage` at describe scope and assigning in `beforeEach` means the page object is accessible to every `test()` in the describe block without passing it as a parameter.

### Test Naming Convention

```
[TC_AUTH_01] standard_user logs in successfully
 ──────────   ────────────────────────────────
 Test case ID  Human-readable description
```

- `TC` = Test Case
- `AUTH` = Feature area (AUTH, INVENTORY, CART, CHECKOUT etc.)
- `01` = Sequential number within the feature

The ID in the title makes it easy to trace a failing test back to a test case in your test management tool.

---

## Test Data (`login.json`)

Only non-sensitive data lives here. Credentials are in `.env`.

```json
{
    "expected_texts": {
        "swag_labs_title": "Swag Labs"
    },

    "tags": {
        "smoke":      "@smoke",
        "regression": "@regression",
        "login":      "@login",
        "P1":         "@P1",
        "P2":         "@P2",
        "P3":         "@P3"
    },

    "invalid_users": {
        "TC_AUTH_02": { "user": "", "password": "", "expected_error": "Epic sadface: Username is required" },
        "TC_AUTH_03": { "user": "standard_user", "password": "", "expected_error": "Epic sadface: Password is required" }
    },

    "error_banner": {
        "TC_AUTH_07": { "expected_error": "Epic sadface: Sorry, this user has been locked out." }
    },

    "password_masking": {
        "TC_AUTH_15": { "expected_type": "password" }
    },

    "session": {
        "TC_AUTH_20": { "url": "/inventory.html", "expected_error": "Epic sadface: You can only access '/inventory.html' when you are logged in." }
    }
}
```

**Why objects keyed by TC ID instead of arrays?**

Arrays require `.find(u => u.id === 'TC_AUTH_02')` to access a specific entry. Objects let you go straight to the data:
```js
// Array — need .find() every time
const tc = testdata.invalid_users.find(u => u.id === 'TC_AUTH_02');

// Object — direct access, no logic
const tc = testdata.invalid_users.TC_AUTH_02;
```

**What belongs in JSON vs .env?**

| JSON | .env |
|---|---|
| Expected error messages | Real usernames |
| Expected page titles | Password |
| Wrong/invalid credentials (intentional test data) | Any token or API key |
| URL paths | Anything that changes per environment |
| Tag names | |

---

## Environment Variables

**File:** `.env` (gitignored — never committed)

```
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

**Usage in tests:**
```js
import { ENV } from '../../utils/env.js';

await loginPage.login(ENV.standard_user, ENV.password);
```

**Why `utils/env.js` instead of `process.env` directly in tests?**
If a variable is renamed in `.env`, you update it in one file. Without this layer, you'd need to find and replace `process.env.STANDARD_USER` across every test file.

**On CI (GitHub Actions):** Environment variables are set as repository secrets and injected at runtime — the `.env` file is never present on CI.

---

## Tagging Strategy

Tags are defined once in `login.json` and used across all test files.

```js
// Destructured once at the top of each test file
const { smoke, regression, P1, P2, P3 } = testdata.tags;
// smoke = "@smoke", P1 = "@P1" etc.

// Applied per test — no string literals scattered in test files
test("[TC_AUTH_01] ...", { tag: [smoke, P1] }, async ({ page }) => { ... });
```

**Tag definitions:**

| Tag | Purpose |
|---|---|
| `@smoke` | Critical path tests — run before every deployment |
| `@regression` | Full regression suite — run on PRs and nightly |
| `@login` | All login-related tests — useful for targeted runs |
| `@P1` | Highest priority — must pass before release |
| `@P2` | High priority |
| `@P3` | Lower priority |

**Running by tag:**
```bash
npm run test:smoke                          # all @smoke tests
npm run test:regression                     # all @regression tests
npx playwright test --grep @P1             # all P1 priority tests
npx playwright test --grep "@smoke|@P1"    # smoke OR P1
npx playwright test --grep-invert @P3      # exclude P3 tests
```

---

## Parallelism and Memory Management

### The problem

Playwright runs tests in parallel by default. Each parallel worker is a separate browser instance. Without limits, a large test suite can spin up dozens of browser instances simultaneously, exhausting memory — especially on CI.

### Fix 1 — Cap workers in config

```js
workers: process.env.CI ? 2 : 4
```

- CI gets 2 workers — GitHub Actions runners have limited RAM
- Locally gets 4 workers — fast feedback without overloading your machine

### Fix 2 — Split tests into focused files

Each file = one worker. Splitting auth tests into 5 files means at most 5 workers for the auth suite, each handling a small number of tests.

```
login.valid.test.js         → worker 1 → 4 tests (parallel within file)
login.invalid.test.js       → worker 2 → 5 tests (parallel within file)
login.session.test.js       → worker 3 → 3 tests (serial within file)
login.error-banner.test.js  → worker 4 → 1 test
login.ui.test.js            → worker 5 → 1 test
```

### Fix 3 — Configure parallelism per suite

There are two levels of parallelism in this framework:

**Level 1 — File level** (`fullyParallel: true` in config)
Each file gets its own worker and runs in parallel with other files. This happens automatically — no code needed in test files.

**Level 2 — Describe level** (`test.describe.configure` inside each file)
Controls how tests run *within* a file — either all at once (parallel) or one after another (serial).

```
File level — always parallel (fullyParallel: true):

login.valid.test.js        → worker 1 ──┐
login.invalid.test.js      → worker 2   │  all files run at the same time
login.session.test.js      → worker 3   │
login.error-banner.test.js → worker 4   │
login.ui.test.js           → worker 5 ──┘

Inside login.valid.test.js (mode: 'parallel') — tests also run simultaneously:
├── TC_AUTH_01 → sub-worker A ──┐
├── TC_AUTH_12 → sub-worker B   │  all 4 run at the same time
├── TC_AUTH_13 → sub-worker C   │
└── TC_AUTH_14 → sub-worker D ──┘

Inside login.session.test.js (mode: 'serial') — tests run one after another:
├── TC_AUTH_17 → worker 3 ──→ finishes
├── TC_AUTH_18 → worker 3 ──→ finishes  (waits for previous)
└── TC_AUTH_20 → worker 3 ──→ finishes  (waits for previous)
```

`workers: 4` in config caps how many of those file-level workers run simultaneously.

```js
// Independent tests — run at the same time within the worker
test.describe("Valid Login", () => {
    test.describe.configure({ mode: 'parallel' });
});

// State-sensitive tests — run one after another within the worker
test.describe("Session", () => {
    test.describe.configure({ mode: 'serial' });
});
```

**Why `serial` for session tests?**
Session tests involve logout, browser back button, and direct URL access. Though each test starts fresh via `beforeEach`, running them serially avoids any shared resource contention on the same domain and makes failures easier to diagnose.

---

## Session and Auth Setup

### The problem

Feature tests (inventory, cart, checkout) all need to start logged in. If every test does a full login through the UI, you're making 50+ login requests for a 50-test suite — slow, and it hammers the server.

### The solution — `storageState`

Log in once, save the browser session (cookies + localStorage) to a file. Every feature test loads that file instead of logging in.

**`utils/auth.setup.js`:**
```js
import { test as setup } from '@playwright/test';
import path from 'path';
import { ENV } from './env.js';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate as standard_user', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill(ENV.standard_user);
    await page.getByPlaceholder('Password').fill(ENV.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/inventory/);

    // Saves cookies + localStorage — feature tests load this instead of logging in
    await page.context().storageState({ path: authFile });
});
```

**What `storageState` saves:**
- Session cookies (what keeps you logged in)
- `localStorage` and `sessionStorage` values
- IndexedDB (if needed — e.g. Firebase auth tokens)

**Feature test project in config (uncomment when ready):**
```js
{
    name: 'chromium-authenticated',
    testMatch: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
    use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json', // starts every test already logged in
    },
    dependencies: ['setup'], // setup project runs first, automatically
}
```

### Why auth tests do NOT use storageState

Auth tests (`tests/auth/`) are specifically testing the login page — valid logins, invalid credentials, locked out users, session logout. They must start at the login page in a logged-out state. Adding `storageState` would bypass the login page entirely and break these tests.

### When does setup run?

Only when a project with `dependencies: ['setup']` is included in the run:

```bash
npm run test:auth             # --project=chromium --project=firefox             → setup never runs
npm run test:auth:chrome      # --project=chromium                               → setup never runs
npm run test:auth:firefox     # --project=firefox                                → setup never runs
npm run test:features         # --project=chromium-authenticated --project=firefox-authenticated → setup runs once
npm run test:features:chrome  # --project=chromium-authenticated                 → setup runs first
npm run test:features:firefox # --project=firefox-authenticated                  → setup runs first
npm test                      # all projects → setup runs once, all feature projects reuse its output
```

---

## Projects Overview

```js
projects: [
    // Runs auth.setup.js — only fires when a feature project depends on it
    { name: 'setup', testMatch: /.*\.setup\.js/ },

    // Auth tests — no storageState, no setup dependency
    {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 }, headless: true, screenshot: 'only-on-failure', video: 'on-first-retry' },
    },
    {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'], viewport: { width: 1920, height: 1080 }, headless: true, screenshot: 'only-on-failure', video: 'on-first-retry' },
    },

    // Feature tests — use saved session, only run tests under inventory/cart/checkout
    {
        name: 'chromium-authenticated',
        testMatch: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
        use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
    },
    {
        name: 'firefox-authenticated',
        testMatch: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
        use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/user.json' },
        dependencies: ['setup'],
    },
]
```

---

## Debugging

### View trace after a failure

Traces are recorded on first retry. To open a trace:
```bash
npx playwright show-trace test-results/.../trace.zip
```

Or open the HTML report — it embeds the trace viewer:
```bash
npm run test:report
```

### Run in headed mode

Watch the browser execute tests in real time:
```bash
npx playwright test --headed
```

### Step through a test interactively

Pauses at each action — useful for pinpointing exactly where a test fails:
```bash
npx playwright test --debug
```

### Screenshots and videos

- Screenshots are saved to `test-results/` on failure automatically
- Videos are recorded on first retry and accessible from the HTML report

### Run a single test

```bash
npx playwright test --grep "TC_AUTH_01"
npx playwright test tests/auth/valid-login.test.js
```

---

## CI/CD

**File:** `.github/workflows/playwright.yml`

Runs on every push and pull request to `main` / `master`.

```yaml
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/* }
      - run: npm ci                              # clean install
      - run: npx playwright install --with-deps  # install browsers
      - run: npx playwright test                 # run all tests
      - uses: actions/upload-artifact@v4         # upload HTML report
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

**Key CI behaviours (set in `playwright.config.js`):**
- `workers: 2` — constrained to avoid OOM on GitHub Actions runners
- `retries: 1` — one retry per failed test to filter out flakiness
- `forbidOnly: true` — build fails if `test.only` is accidentally committed
- `headless: true` — no display server available on CI (default for non-configured browsers)

**Adding secrets to CI:**
Repository → Settings → Secrets and Variables → Actions → New repository secret
Add each `.env` variable as a secret (`PASSWORD`, `STANDARD_USER` etc.).

---

## Adding New Tests

### New test case in an existing auth suite

1. Add entry to `testdata/login.json` under the relevant category:
   ```json
   "invalid_users": {
       "TC_AUTH_08": { "user": "new_bad_user", "password": "x", "expected_error": "..." }
   }
   ```
2. Add a `test()` block to the relevant file (`invalid-login.test.js`):
   ```js
   test("[TC_AUTH_08] ...", { tag: [regression, P1] }, async () => {
       const tc = testdata.invalid_users.TC_AUTH_08;
       await loginPage.login(tc.user, tc.password);
       await expect(loginPage.errorMessage).toHaveText(tc.expected_error);
   });
   ```

### New feature area (e.g. inventory)

1. Create `pages/inventory.page.js` with locators and actions for that page
2. Create `tests/inventory/` folder with focused test files
3. Add inventory test data to `testdata/inventory.json`
4. Uncomment `chromium-authenticated` project in `playwright.config.js`
5. Uncomment `setup` project (they are a pair — both needed)
6. Tests start already logged in — no login steps needed in inventory tests

### New tag

1. Add to `testdata/login.json`:
   ```json
   "tags": {
       "sanity": "@sanity"
   }
   ```
2. Destructure in test file: `const { sanity } = testdata.tags;`
3. Add npm script if needed: `"test:sanity": "playwright test --grep @sanity"`
