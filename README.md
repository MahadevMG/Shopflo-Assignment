# Shopflo Assignment - Playwright Test Framework

![Playwright](https://img.shields.io/badge/Playwright-1.61-45ba4b?logo=playwright&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=nodedotjs&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

End-to-end UI automation and REST API test suite for [Swag Labs](https://www.saucedemo.com) (Assignment 1) and [FakeStore API](https://fakestoreapi.com) (Assignment 2), built entirely with Playwright following the Page Object Model pattern.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Viewing Results](#viewing-results)
- [Test Coverage](#test-coverage)
- [Documentation](#documentation)

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev) | Browser automation, test runner, and API client |
| [Node.js](https://nodejs.org) | Runtime |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |

---

## Project Structure

```
├── pages/                          # Page Object Model classes (UI)
│   ├── login.page.js
│   ├── inventory.page.js
│   ├── cart.page.js
│   └── checkout.page.js
│
├── api/                            # API layer (Assignment 2)
│   ├── clients/
│   │   ├── auth.client.js          # POST /auth/login wrapper
│   │   └── cart.client.js          # Cart CRUD wrappers
│   └── schemas/
│       ├── cart.schema.js          # Schema validation helpers
│       └── contract.js             # Contract / snapshot assertion engine
│
├── tests/                          # All test files organised by feature
│   ├── auth/                       # Login / session tests (UI)
│   ├── inventory/                  # Product listing, sorting, cart badge (UI)
│   ├── cart/                       # Cart add / remove / quantity (UI)
│   ├── checkout/                   # Checkout flow end-to-end (UI)
│   ├── api/                        # REST API tests (no browser)
│   │   ├── auth/
│   │   │   └── post.auth.test.js   # POST /auth/login
│   │   └── cart/
│   │       ├── get.cart.test.js         # GET /carts
│   │       ├── post.cart.test.js        # POST /carts
│   │       ├── put.cart.test.js         # PUT /carts/{id}
│   │       ├── delete.cart.test.js      # DELETE /carts/{id}
│   │       ├── cart.datadriven.test.js  # Data-driven POST /carts
│   │       └── cart.contract.test.js    # Contract / snapshot tests
│   └── utils/
│       └── auth.setup.mjs          # Per-user session setup
│
├── testdata/                       # Non-sensitive test data (JSON)
│   ├── login.json
│   ├── inventory.json
│   ├── tags.json
│   ├── cart.json
│   ├── checkout.json
│   └── api/
│       ├── auth.json               # FakeStoreAPI credentials and variants
│       ├── cart.json               # Cart payloads and IDs
│       └── contracts/
│           ├── cart-read.contract.json      # Shape snapshot for GET + DELETE
│           └── cart-mutation.contract.json  # Shape snapshot for POST + PUT
│
├── utils/
│   └── env.js                      # Centralised ENV object
│
├── playwright/.auth/               # Auto-generated session files (gitignored)
│   ├── standard_user.json
│   ├── visual_user.json
│   ├── error_user.json
│   ├── problem_user.json
│   └── performance_glitch_user.json
│
├── playwright.config.js            # Playwright configuration
├── .env                            # Credentials - never commit (gitignored)
├── Framework.md                    # Detailed framework documentation
└── docs/index.md                   # Published GitHub Pages documentation
```

> Full structure, patterns, and rationale explained in [Framework.md](./Framework.md)

---

## Setup

### Prerequisites

- Node.js 18 or higher
- npm

### 1. Clone the repository

```bash
git clone git@github.com:MahadevMG/Shopflo-Assignment.git
cd Shopflo-Assignment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npx playwright install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```ini
STANDARD_USER=standard_user
LOCKED_OUT_USER=locked_out_user
PROBLEM_USER=problem_user
PERFORMANCE_GLITCH_USER=performance_glitch_user
ERROR_USER=error_user
VISUAL_USER=visual_user
PASSWORD=secret_sauce
```

> Credentials are kept out of source control. See [Framework.md - Environment Variables](./Framework.md#environment-variables) for details.

---

## Running Tests

### Run all tests (UI + API)

```bash
npm test
```

### Run auth tests only (UI, both browsers)

```bash
npm run test:auth            # Chrome + Firefox
npm run test:auth:chrome
npm run test:auth:firefox
```

### Run feature UI tests (inventory, cart, checkout)

```bash
npm run test:features            # Chrome + Firefox (runs setup first)
npm run test:features:chrome
npm run test:features:firefox
```

> Feature tests depend on the `setup` project which logs in once per user and saves sessions. Runs automatically - no manual step needed.

### Run API tests only

```bash
npx playwright test tests/api/ --project=api
```

> See [API.md](./API.md) for all API-specific run commands (by suite, by file, by TC ID).

### Run by tag

```bash
npm run test:smoke       # @smoke tests
npm run test:regression  # @regression tests
```

### Run by priority

```bash
npx playwright test --grep @P1
npx playwright test --grep @P2
```

### Run a specific test file or test case

```bash
npx playwright test tests/checkout/checkout.validation.test.js
npx playwright test --grep "TC_CHK_04"
npx playwright test --grep "TC_API_01"
```

### Headed mode

```bash
npx playwright test --headed
```

### Debug mode (step-by-step)

```bash
npx playwright test --debug
```

---

## Viewing Results

### HTML Report

```bash
npm run test:report
```

Shows pass/fail per test, screenshots on failure, video on retry, and embedded trace viewer.

### Trace Viewer

```bash
npx playwright show-trace test-results/<folder>/trace.zip
```

### CI Reports

Every push and PR runs the full suite via GitHub Actions and uploads an HTML report as an artifact retained for 30 days.

`GitHub → Actions → latest run → Artifacts → playwright-report`

The latest report is also published to GitHub Pages and always reflects the most recent `master` run:

**[https://mahadevmg.github.io/Shopflo-Assignment/report/](https://mahadevmg.github.io/Shopflo-Assignment/report/)**

---

## Test Coverage

### Assignment 1 - Swag Labs UI (`tests/`)

| Suite | Files | Test Count | Notes |
|---|---|---|---|
| Auth | `tests/auth/` | 14 | Login/logout, session, UI masking |
| Inventory | `tests/inventory/` | 20+ | Sort, display, cart badge, links, navigation |
| Cart | `tests/cart/` | 20+ | Add, remove, quantity, persistence |
| Checkout | `tests/checkout/` | 32 | Validation, navigation, summary, complete, edge, E2E |

### Assignment 2 - FakeStore API (`tests/api/`)

35 API tests across 7 suites — auth, cart CRUD, data-driven, and contract/snapshot tests.

> Full details: [API.md](./API.md) — clients, schema validation, contract testing, test data, FakeStoreAPI quirks, and all running commands.  

---

## Documentation

| Document | What it covers |
|---|---|
| [API.md](./API.md) | Full API test suite docs — clients, schema validation, contract testing, test data, FakeStoreAPI quirks |
| [Framework.md](./Framework.md) | Folder structure, POM, locator strategy, session handling, API client pattern, Playwright config, CI, how to add new tests |
| [docs/index.md - Decisions](./docs/index.md#decisions) | Why Playwright over Selenium/WebdriverIO, why Playwright was reused for API testing, every major architectural decision with rationale |
| [docs/index.md](./docs/index.md) | GitHub Pages published documentation - full narrative with challenges and solutions |

---

## CI/CD

Tests run automatically on every push and pull request via GitHub Actions.

```
Push / PR → Restore cache → Install deps → Install browsers → Run all tests → Upload report
```

To add credentials on CI: `Repository → Settings → Secrets → Actions` — add each `.env` variable as a repository secret.
