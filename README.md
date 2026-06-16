# Shopflo Assignment — Playwright Test Framework

![Playwright](https://img.shields.io/badge/Playwright-1.61-45ba4b?logo=playwright&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=nodedotjs&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

End-to-end test automation for [Swag Labs](https://www.saucedemo.com) built with Playwright, following the Page Object Model pattern.

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
| [Playwright](https://playwright.dev) | Browser automation and test runner |
| [Node.js](https://nodejs.org) | Runtime |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |

---

## Project Structure

```
├── pages/               # Page Object Model classes
├── tests/               # Test files organised by feature
│   └── auth/            # Authentication test suite
├── testdata/            # Non-sensitive test data (JSON)
├── utils/               # Shared utilities (ENV, auth setup)
├── playwright.config.js # Playwright configuration
├── .env                 # Credentials — never commit (gitignored)
└── Framework.md         # Detailed framework documentation
```

> Full structure and architecture explained in [Framework.md](./Framework.md)

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

```bash
cp .env.example .env   # if example exists, otherwise create manually
```

```ini
STANDARD_USER=standard_user
LOCKED_OUT_USER=locked_out_user
PROBLEM_USER=problem_user
PERFORMANCE_GLITCH_USER=performance_glitch_user
ERROR_USER=error_user
VISUAL_USER=visual_user
PASSWORD=secret_sauce
```

> Credentials are kept out of source control. See [Framework.md — Environment Variables](./Framework.md#environment-variables) for details.

---

## Running Tests

### Run all tests

```bash
npm test
```

### Run auth tests

```bash
npm run test:auth          # Auth tests on both Chrome and Firefox
npm run test:auth:chrome   # Auth tests on Chrome only
npm run test:auth:firefox  # Auth tests on Firefox only
```

### Run feature tests (requires saved session)

```bash
npm run test:features          # Feature tests on both Chrome and Firefox
npm run test:features:chrome   # Feature tests on Chrome only
npm run test:features:firefox  # Feature tests on Firefox only
```

> Feature tests depend on the `setup` project which logs in once and saves the session. This runs automatically — no manual step needed.

### Run by tag

```bash
npm run test:smoke       # Smoke tests (@smoke tag)
npm run test:regression  # Full regression suite (@regression tag)
```

### Run by priority

```bash
npx playwright test --grep @P1   # Critical priority tests
npx playwright test --grep @P2   # High priority tests
```

### Run a specific file or test

```bash
npx playwright test tests/auth/valid-login.test.js
npx playwright test --grep "TC_AUTH_01"
```

### Headed mode (watch the browser)

Tests run headless by default. To watch the browser:

```bash
npx playwright test --headed    # force headed (visible browser)
```

### Debug a test step by step

```bash
npx playwright test --debug
```

> For tag strategy and all available scripts see [Framework.md — Tagging Strategy](./Framework.md#tagging-strategy)

---

## Viewing Results

### HTML Report

After any test run, an HTML report is generated automatically:

```bash
npm run test:report
```

This opens an interactive report in your browser showing:
- Pass / fail status per test
- Screenshots on failure
- Video recordings on retry
- Trace viewer for step-by-step replay

### Trace Viewer

Traces are captured on first retry. To open a trace manually:

```bash
npx playwright show-trace test-results/<folder>/trace.zip
```

### CI Reports

On every push and pull request, the GitHub Actions pipeline runs all tests and uploads the HTML report as an artifact retained for **30 days**.

To view: `GitHub → Actions → latest workflow run → Artifacts → playwright-report`

---

## Test Coverage

### Authentication (`tests/auth/`)

| File | Test Cases | Mode |
|---|---|---|
| `login.valid.test.js` | TC_AUTH_01, 12, 13, 14 — successful logins for all user types | Parallel |
| `login.invalid.test.js` | TC_AUTH_02–06 — empty fields, wrong credentials | Parallel |
| `login.error-banner.test.js` | TC_AUTH_07 — locked out user, banner dismiss | — |
| `login.session.test.js` | TC_AUTH_17, 18, 20 — logout, back button, direct URL | Serial |
| `login.ui.test.js` | TC_AUTH_15 — password field masking | — |

| Tag | Tests |
|---|---|
| `@smoke` | TC_AUTH_01, TC_AUTH_17 |
| `@regression` | All others |
| `@P1` | TC_AUTH_01, 05, 06, 07, 17, 18, 20 |
| `@P2` | TC_AUTH_02, 12, 13, 15 |
| `@P3` | TC_AUTH_03, 04, 14 |

---

## Documentation

| Document | What it covers |
|---|---|
| [Framework.md](./Framework.md) | Architecture, POM, locator strategy, parallelism, session handling, CI config, how to add new tests |
| [DECISIONS.md](./DECISIONS.md) | Framework choice rationale, Selenium vs WebdriverIO vs Playwright comparison, extension plan, future roadmap |

---

## CI/CD

Tests run automatically on every push and pull request via GitHub Actions.

```
Push / PR → Install deps → Install browsers → Run tests → Upload report
```

To add credentials on CI: `Repository → Settings → Secrets → Actions` — add each `.env` variable as a repository secret.
