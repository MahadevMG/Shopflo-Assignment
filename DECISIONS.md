# Framework Decisions

This document explains why Playwright was chosen over alternatives, how the framework is structured to scale, and the reasoning behind every major technical decision. Update this file whenever a significant architectural choice is made.

---

## Table of Contents

- [Framework Comparison](#framework-comparison)
- [Why Playwright](#why-playwright)
- [Key Decisions](#key-decisions)
- [Extension Plan](#extension-plan)
- [Future Roadmap](#future-roadmap)

---

## Framework Comparison

### Selenium

The oldest and most widely adopted browser automation framework. Built on the W3C WebDriver protocol - every browser action goes through an HTTP request to a browser driver (chromedriver, geckodriver etc.).

**Strengths:**
- Largest community and ecosystem
- Multi-language support (Java, Python, JavaScript, C#, Ruby)
- Industry standard - most enterprises already use it

**Weaknesses:**
- Requires managing separate browser drivers - versions must match browser versions exactly, causing constant maintenance overhead
- No built-in test runner - needs Mocha, Jest, TestNG etc. wired up separately
- No built-in parallelism - requires Selenium Grid setup
- No auto-waiting - manual `sleep()` or `WebDriverWait` calls everywhere, leading to flaky tests
- No built-in reporting - needs third-party tools (Allure, ExtentReports)
- No native network interception
- Slowest of the three - every action is an HTTP round trip to the driver

**Verdict:** Good for Java-heavy enterprise teams or cross-language requirements. Poor developer experience for a modern JS/TS project.

---

### WebdriverIO

A Node.js-first framework built on top of WebDriver protocol with optional Chrome DevTools Protocol (CDP) support. Better JavaScript integration than Selenium but still carries some of its limitations.

**Strengths:**
- Node.js native - better JavaScript/TypeScript integration than Selenium
- Has a built-in test runner with support for Mocha, Jasmine, and Cucumber
- Good Allure reporting integration
- `browser.waitUntil` provides better waiting than raw Selenium
- Supports both WebDriver and CDP modes

**Weaknesses:**
- Still requires browser driver management in WebDriver mode
- Auto-waiting is less reliable than Playwright - still prone to flakiness
- Steeper learning curve - more configuration required to get started
- CDP mode (appium/devtools) is not as mature as Playwright's implementation
- Smaller community than Selenium, growing slower than Playwright
- No built-in trace viewer or visual debugging tool
- `storageState` equivalent is more complex to set up

**Verdict:** A solid choice for teams already invested in WebdriverIO or needing Cucumber BDD. For a greenfield JS project, Playwright is faster to set up and more reliable.

---

### Playwright

Microsoft's browser automation library built from scratch using the Chrome DevTools Protocol for Chromium, a custom protocol for Firefox, and WebKit. Not a wrapper around WebDriver.

**Strengths:**
- No driver management - Playwright downloads and manages its own browser binaries
- Auto-waiting built in at the locator level - no manual waits or sleeps needed
- Built-in test runner with first-class TypeScript support
- Built-in parallelism - file-level and describe-level, configurable per suite
- Built-in reporters - HTML, JSON, JUnit, GitHub Actions annotations, list
- `storageState` - save and reuse authenticated sessions across tests, eliminating redundant logins
- Trace viewer - records every action, screenshot, network request for post-mortem debugging
- Network interception - mock APIs, block requests, modify responses
- Mobile emulation - emulate device viewports and touch events
- `codegen` - record browser actions and generate test code automatically
- Fastest of the three - direct CDP connection, no HTTP round trips
- Actively developed by Microsoft with regular releases

**Weaknesses:**
- Younger ecosystem than Selenium - fewer third-party integrations
- Only supports JavaScript/TypeScript, Python, Java, and C# (no Ruby)
- No Cucumber/BDD support out of the box (Playwright CT covers some use cases)

**Verdict:** Best choice for modern JavaScript/TypeScript projects. Fastest setup, most reliable execution, best developer tooling.

---

## Why Playwright

| Criterion | Selenium | WebdriverIO | Playwright |
|---|---|---|---|
| Driver management | Manual | Manual (WebDriver mode) | Automatic |
| Auto-waiting | No | Partial | Yes - all locators |
| Built-in test runner | No | Yes | Yes |
| Built-in parallelism | No (Grid) | Partial | Yes |
| Built-in reporting | No | Limited | Yes (HTML, JSON, GitHub) |
| Session reuse (`storageState`) | No | Complex | Built-in |
| Trace / debug viewer | No | No | Yes |
| Network interception | No | Partial (CDP mode) | Yes |
| Speed | Slow | Medium | Fast |
| Setup complexity | High | Medium | Low |
| TypeScript support | Third-party | Yes | First-class |
| Community growth | Stable | Slow | Fast |

**Decision: Playwright**

The primary reasons for choosing Playwright for this project:

1. **`storageState`** - Feature tests (inventory, cart, checkout) all need to start logged in. Playwright's `storageState` logs in once and reuses the session, cutting login overhead across the entire feature suite.

2. **Auto-waiting** - Playwright waits for elements to be actionable before interacting. No `sleep()` calls, no flaky `waitUntil` conditions scattered through test code.

3. **Zero driver setup** - `npx playwright install` is the entire setup. No chromedriver version pinning, no PATH configuration, no driver server management.

4. **Built-in parallelism** - File-level parallelism via `fullyParallel: true` and describe-level control via `test.describe.configure({ mode: 'serial' | 'parallel' })`. No external tooling needed.

5. **GitHub Actions integration** - The `github` reporter annotates failed tests directly on PRs. No separate reporting service needed.

6. **Trace viewer** - When a test fails on CI, the trace file captures every action, screenshot, DOM snapshot, and network request. Reproducible debugging without re-running locally.

---

## Key Decisions

### Page Object Model

**Decision:** All locators and page actions live in `pages/` classes. Test files never contain raw selectors.

**Why:** When a selector changes, fix it in one place instead of hunting through every test. Tests also read like user journeys (`loginPage.login(user, pass)`) rather than low-level DOM manipulation.

### Test data in JSON, credentials in `.env`

**Decision:** Non-sensitive data (error messages, expected texts, invalid credentials used intentionally) lives in `testdata/login.json`. Real credentials live only in `.env`.

**Why:** `.env` is gitignored and never committed. Anyone reading the test data file sees expected strings, not production credentials. On CI, secrets are injected from GitHub repository secrets.

### Tests split into focused files

**Decision:** Auth tests are split across 5 files (`login.valid`, `login.invalid`, `login.error-banner`, `login.session`, `login.ui`) instead of one large file.

**Why:** Each file is an independent worker. A single file with 14 tests all running in parallel exhausts memory. Splitting by concern means better isolation, faster failure feedback, and clearer ownership.

### Serial mode for session tests

**Decision:** `login.session.test.js` uses `test.describe.configure({ mode: 'serial' })`.

**Why:** Session tests (logout, browser back, direct URL access) involve shared domain state. Running them serially avoids race conditions and makes failures easier to isolate.

### `testIgnore` on chromium/firefox

**Decision:** `chromium` and `firefox` projects ignore `**/inventory/**`, `**/cart/**`, `**/checkout/**`.

**Why:** Without this, feature tests would be picked up by non-auth projects, run without a session, hit a redirect to login, and fail silently. `testIgnore` makes the boundary explicit - adding new non-auth test folders is automatic, adding a new feature folder requires one line in `testIgnore`.

### Workers capped

**Decision:** `workers: process.env.CI ? 2 : 4`

**Why:** Uncapped workers spin up as many browser instances as CPU cores. On CI (2-core GitHub Actions runners) this causes OOM. Locally 4 workers balances speed and memory.

---

## Extension Plan

### Parallelism

The current setup has two levels of parallelism:

```
Level 1 - File level (fullyParallel: true)
Each file gets its own worker, all files run simultaneously.

Level 2 - Describe level (test.describe.configure)
Controls how tests run within a file - parallel or serial.
```

**To scale to 1000+ tests:**

1. **Sharding** - Split the test suite across multiple CI jobs. Each shard runs a subset:
   ```yaml
   strategy:
     matrix:
       shard: [1, 2, 3, 4]
   steps:
     - run: npx playwright test --shard=${{ matrix.shard }}/4
   ```
   4 shards = 4x faster CI. Merge reports using the `blob` reporter.

2. **Project-based splitting** - Separate CI jobs per project (`chromium`, `firefox`, `chromium-authenticated`) to run browsers truly in parallel at the job level.

3. **Tag-based splitting** - Run `@smoke` on every PR, `@regression` nightly. Keeps PR feedback under 2 minutes.

### Reporting

Current reporters:

| Reporter | When | What it shows |
|---|---|---|
| `list` | CI only | Every test result printed to Actions log in real time |
| `github` | CI only | Failed tests annotated inline on PRs |
| `html` | Always | Full visual report with screenshots, videos, traces |

**Planned improvements:**

1. **GitHub Pages** - Publish the HTML report to `gh-pages` branch after every master run. Accessible via URL without downloading an artifact:
   ```yaml
   - name: Deploy report to GitHub Pages
     uses: peaceiris/actions-gh-pages@v3
     with:
       github_token: ${{ secrets.GITHUB_TOKEN }}
       publish_dir: playwright-report
   ```

2. **Allure Report** - Richer reporting with history trends, flakiness tracking, test categorisation. Useful once the suite grows beyond 100 tests.

3. **Slack notifications** - Post a summary (X passed, Y failed) to a Slack channel after every CI run using `slackapi/slack-github-action`.

---

## Future Roadmap

| Area | Status | Plan |
|---|---|---|
| Auth tests | Done | 14 tests across 5 files |
| Inventory tests | Pending | Add `tests/inventory/` + `pages/inventory.page.js` |
| Cart tests | Pending | Add `tests/cart/` + `pages/cart.page.js` |
| Checkout tests | Pending | Add `tests/checkout/` + `pages/checkout.page.js` |
| Visual regression | Not started | Consider `@playwright/experimental-ct-react` or Percy |
| API testing | Not started | Playwright supports `request` fixture for API calls |
| Mobile testing | Not started | Uncomment `Mobile Chrome` / `Mobile Safari` projects in config |
| Sharding | Not started | Add when suite exceeds ~100 tests and CI takes >10 min |
| GitHub Pages reporting | Not started | Add when team needs shared report access |
| Allure reporting | Not started | Add when historical trends and flakiness tracking needed |

---

*Last updated: 2026-06-16*
*Update this file whenever a framework-level decision is made or the extension plan changes.*
