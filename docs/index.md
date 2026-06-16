# Shopflo E2E Test Framework

**Playwright · Node.js · GitHub Actions · Page Object Model**

End-to-end test automation framework built for [Swag Labs](https://www.saucedemo.com) as a Shopflo assignment. This page documents the thinking behind every decision — from framework choice to session handling to CI pipeline design.

[View on GitHub](https://github.com/MahadevMG/Shopflo-Assignment) · [Test Report](./report/) · [Test Coverage](#test-coverage) · [Future Plans](#future-plans)

---

## The Goal

Build a scalable, maintainable E2E test framework that:
- Covers authentication flows end-to-end
- Can expand to inventory, cart, and checkout without restructuring
- Runs reliably on CI without manual intervention
- Is readable and maintainable by anyone joining the project

---

## Why Playwright

Three frameworks were evaluated: **Selenium**, **WebdriverIO**, and **Playwright**.

| Criterion | Selenium | WebdriverIO | Playwright |
|---|---|---|---|
| Driver management | Manual | Manual | Automatic |
| Auto-waiting | No | Partial | Yes |
| Built-in test runner | No | Yes | Yes |
| Built-in parallelism | No | Partial | Yes |
| Session reuse | No | Complex | Built-in |
| Trace / debug viewer | No | No | Yes |
| GitHub Actions integration | No | No | Built-in reporter |
| Setup time | High | Medium | Low |

**Playwright won on three decisive factors:**

**1. `storageState`** — Feature tests (inventory, cart, checkout) all require an authenticated session. Playwright logs in once, saves the session to a file, and every feature test loads it — no repeated login flows.

**2. Auto-waiting** — Every locator waits for the element to be visible, enabled, and stable before acting. Zero manual `sleep()` calls anywhere in the codebase.

**3. Zero driver management** — `npx playwright install` handles everything. No chromedriver version pinning, no PATH issues, no driver server processes to manage.

---

## Architecture

```
Shopflo-Assignment/
│
├── pages/                    # Page Object Model
│   ├── login.page.js         # Login locators + actions
│   └── inventory.page.js     # Inventory locators + actions
│
├── tests/
│   └── auth/                 # Authentication test suite
│       ├── login.valid.test.js       # Successful logins
│       ├── login.invalid.test.js     # Validation errors
│       ├── login.error-banner.test.js # Locked out user
│       ├── login.session.test.js     # Logout + session
│       └── login.ui.test.js          # Password masking
│
├── testdata/login.json       # Non-sensitive test data
├── utils/
│   ├── env.js                # Centralised ENV object
│   └── auth.setup.js         # Saves login session once
│
└── playwright.config.js      # All configuration
```

### Page Object Model

Every page has a class in `pages/`. Locators and actions live there — test files never contain raw selectors.

```js
// pages/login.page.js
export class LoginPage {
    constructor(page) {
        this.usernameInput = page.getByRole('textbox', { name: 'Username' });
        this.passwordInput = page.getByPlaceholder('Password');
        this.loginButton   = page.getByRole('button', { name: 'Login' });
        this.errorMessage  = page.locator('[data-test="error"]');
    }

    async login(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}
```

When a selector changes, fix it in one file — not across every test.

---

## Key Challenges and How They Were Solved

### Challenge 1 — Memory exhaustion from parallel tests

**Problem:** Running 14 tests in a single file with `fullyParallel: true` spun up 14 browser instances simultaneously, exhausting memory — especially on CI.

**Solution:** Split tests into 5 focused files. Each file is one worker. Combined with `workers: 2` on CI and `workers: 4` locally, the number of concurrent browser instances stays predictable.

```
login.valid.test.js         → worker 1 → 4 tests
login.invalid.test.js       → worker 2 → 5 tests
login.session.test.js       → worker 3 → 3 tests (serial)
login.error-banner.test.js  → worker 4 → 1 test
login.ui.test.js            → worker 5 → 1 test
```

### Challenge 2 — Session handling for feature tests

**Problem:** Every feature test needs to start logged in. Repeating login UI steps across 50+ tests is slow and adds unnecessary load.

**Solution:** `storageState` — log in once via `auth.setup.js`, save cookies and localStorage to `playwright/.auth/user.json`. Feature test projects load this file before any test starts.

```js
// utils/auth.setup.js — runs once before feature tests
await page.context().storageState({ path: authFile });
```

```js
// playwright.config.js — feature project loads saved session
{
    name: 'chromium-authenticated',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
}
```

Auth tests are deliberately excluded from `storageState` — they test the login page itself and must start logged out.

### Challenge 3 — Feature tests accidentally running without auth

**Problem:** The `chromium` and `firefox` projects had no restrictions. When inventory tests are added, they would be picked up by non-auth projects, run without a session, hit a redirect, and fail silently.

**Solution:** `testIgnore` on the non-auth projects blocks all feature folders explicitly. New non-auth test folders are automatically included; new feature folders require one line added to `testIgnore`.

```js
{
    name: 'chromium',
    testIgnore: ['**/inventory/**', '**/cart/**', '**/checkout/**'],
}
```

### Challenge 4 — Credentials in source control

**Problem:** Usernames and passwords in test files or JSON data files risk being committed to git.

**Solution:** Three-layer separation:
- `.env` — real credentials, gitignored, never committed
- `utils/env.js` — single place that reads `process.env`, imported by tests
- `testdata/login.json` — only non-sensitive data (error messages, expected texts)

On CI, secrets are stored as GitHub repository secrets and injected as environment variables at runtime.

### Challenge 5 — CI installing dependencies on every run

**Problem:** `npm ci` and `npx playwright install --with-deps` run on every CI job, adding 2–3 minutes of setup time even when nothing changed.

**Solution:** GitHub Actions cache keyed on `package-lock.json` hash. Cache is skipped on the first run and on any dependency change — used directly on all other runs.

```yaml
- uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('package-lock.json') }}

- name: Install Playwright Browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps
```

---

## CI/CD Pipeline

```
Push to master / PR targeting master
            ↓
    Restore node_modules cache
            ↓
    Restore Playwright browser cache
            ↓
    npm ci (only on cache miss)
            ↓
    playwright install (only on cache miss)
            ↓
         Run tests
            ↓
    ┌───────────────────────┐
    │  github reporter      │ → inline PR annotations
    │  list reporter        │ → live log in Actions
    │  html reporter        │ → artifact for download
    └───────────────────────┘
```

Secrets are never in the codebase — each `.env` variable is stored as a GitHub repository secret and injected at runtime.

---

## Test Coverage

### Authentication (`tests/auth/`)

| File | Tests | Mode | Tags |
|---|---|---|---|
| `login.valid.test.js` | TC_AUTH_01, 12, 13, 14 — all user types log in | Parallel | @smoke, @regression |
| `login.invalid.test.js` | TC_AUTH_02–06 — empty fields, wrong credentials | Parallel | @regression |
| `login.error-banner.test.js` | TC_AUTH_07 — locked out, banner dismiss | — | @regression |
| `login.session.test.js` | TC_AUTH_17, 18, 20 — logout, back button, direct URL | Serial | @smoke, @regression |
| `login.ui.test.js` | TC_AUTH_15 — password field masking | — | @regression |

---

## Parallelism Design

Two levels of parallelism run simultaneously:

**Level 1 — File level** (`fullyParallel: true`)
All test files run in parallel across workers. Automatic — no code needed.

**Level 2 — Describe level** (`test.describe.configure`)
Controls how tests run within a file.

```js
// Independent tests — run simultaneously within the worker
test.describe.configure({ mode: 'parallel' });

// State-sensitive tests — run one after another
test.describe.configure({ mode: 'serial' });
```

Session tests use `serial` because they involve logout and browser state — running them in parallel risks interference.

---

## Future Plans

### Immediate

- Add inventory test suite (`tests/inventory/`) — product listing, sorting, filtering
- Add cart test suite (`tests/cart/`) — add to cart, quantity, remove
- Add checkout test suite (`tests/checkout/`) — full purchase flow

### Short term

- **GitHub Pages reporting** — publish HTML report after every master run, accessible via URL without downloading
- **Tag-based CI** — smoke tests only on PRs, full suite on master push
- **`test:login` npm script** — run all `@login` tagged tests

### Medium term

- **Sharding** — split suite across multiple CI jobs when test count exceeds 100 and CI exceeds 10 minutes
- **Allure reporting** — historical trends, flakiness tracking, test categorisation
- **Slack notifications** — post pass/fail summary to a channel after every CI run

### Long term

- **API test layer** — Playwright's `request` fixture for direct API testing alongside UI tests
- **Mobile viewports** — uncomment `Mobile Chrome` / `Mobile Safari` projects in config
- **Visual regression** — screenshot comparison for UI stability

---

## Locator Strategy

Playwright provides multiple ways to locate elements. This framework follows a priority order that favours resilience over convenience:

| Priority | Strategy | Example |
|---|---|---|
| 1st | `getByRole` | `page.getByRole('button', { name: 'Login' })` |
| 2nd | `getByTestId` | `page.getByTestId('shopping-cart-link')` |
| 3rd | `getByPlaceholder` | `page.getByPlaceholder('Password')` |
| 4th | `getByLabel` | `page.getByLabel('Username')` |
| 5th | `locator` (CSS with data-test) | `page.locator('[data-test="error"]')` |
| Last | Class selector | `page.locator('.error-button')` |

`getByRole` is preferred because it reflects how users and assistive technologies see the page — resilient to styling changes. Class names are last because they change with CSS refactoring.

---

*Built by [Mahadev](https://github.com/MahadevMG) · [View source](https://github.com/MahadevMG/Shopflo-Assignment)*
