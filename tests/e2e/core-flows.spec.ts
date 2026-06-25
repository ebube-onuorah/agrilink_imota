import { test, expect } from "@playwright/test";

// Critical end-to-end flows. Assumes the database has been seeded (pnpm db:reset).

test("landing page loads with market messaging", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /fair prices, direct from the farm/i })).toBeVisible();
});

test("farmer can sign in and reach their dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "adaeze@imota.ng");
  await page.fill("#password", "Password123!");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/farmer\/dashboard/);
  await expect(page.getByText(/produce listings/i)).toBeVisible();
});

test("buyer can search produce and open a listing", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "buyer@mile12.ng");
  await page.fill("#password", "Password123!");
  await page.click('button[type="submit"]');
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: /available produce/i })).toBeVisible();
  await page.locator("a[href^='/listings/']").first().click();
  await expect(page.getByText(/asking price/i)).toBeVisible();
});

test("public market prices dashboard renders", async ({ page }) => {
  await page.goto("/prices");
  await expect(page.getByRole("heading", { name: /lagos market prices/i })).toBeVisible();
  await expect(page.getByText(/30-day price trend/i)).toBeVisible();
});
