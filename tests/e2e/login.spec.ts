import { test, expect } from "@playwright/test";

test.describe("login flow", () => {
  test("redirects to /login from protected paths", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    // react-hook-form errors appear in FormMessage
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test("shows server error on bad credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("nope");
    await page.getByLabel(/password/i).fill("wrong");
    await page.getByRole("button", { name: /sign in/i }).click();
    // 401 from /api/auth/login
    await expect(page.getByText(/invalid username or password/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
