// Capture Chapter 4 figure screenshots from the running dev server.
// Run:  node scripts/capture-figures.mjs <outputDir> [baseUrl]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2];
const BASE = process.argv[3] ?? "http://localhost:3005";
if (!OUT) throw new Error("usage: node scripts/capture-figures.mjs <outDir> [baseUrl]");
mkdirSync(OUT, { recursive: true });

const PASSWORD = "Password123!";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function login(email) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

async function logout() {
  await ctx.clearCookies();
}

async function shot(path, file, opts = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800); // let images/chart settle
  await page.screenshot({ path: join(OUT, file), fullPage: opts.fullPage ?? false });
  console.log("captured", file);
}

// 4.1 landing (logged out)
await shot("/", "fig-4-1-landing.png");

// 4.2 registration + login (two shots, combined later)
await shot("/register", "fig-4-2a-register.png");
await shot("/login", "fig-4-2b-login.png");

// 4.3 + 4.4 farmer
await login("adaeze@imota.ng");
await shot("/farmer/dashboard", "fig-4-3-farmer-dashboard.png");
await shot("/farmer/listings/new", "fig-4-4-listing-form.png");
await logout();

// 4.5 buyer search, 4.6 prices, 4.8 transactions
await login("buyer@mile12.ng");
await shot("/search", "fig-4-5-buyer-search.png");
await shot("/prices", "fig-4-6-market-prices.png", { fullPage: true });
// find first transaction link
await page.goto(`${BASE}/transactions`, { waitUntil: "networkidle" });
const href = await page.getAttribute('a[href^="/transactions/"]', "href");
await shot(href ?? "/transactions", "fig-4-8-transaction.png");
await logout();

// 4.7 messaging (restaurant buyer has seeded thread on listing 1)
await login("kitchen@lagos.ng");
await shot("/messages/1", "fig-4-7-messaging.png");
await logout();

// 4.9 admin
await login("admin@farmlink.ng");
await shot("/admin/dashboard", "fig-4-9-admin-dashboard.png");

await browser.close();
console.log("ALL DONE");
