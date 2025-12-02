import { expect } from "@playwright/test";

import { apiLogin } from "./fixtures/users";
import { test } from "./lib/fixtures";

// Basic smoke tests for Swim quick links and pages
// Uses seeded users: pro:pro and free:free

test.describe.configure({ mode: "serial" });

test.describe("Swim quick links", () => {
  test("Pro sees Instructor and Manager and pages load", async ({ page }) => {
    await apiLogin({ username: "pro", email: "pro@example.com", password: "pro" }, page);

    await page.goto("/swim");
    await expect(page.getByRole("heading", { name: /Swim/i })).toBeVisible();

    await expect(page.getByRole("link", { name: /Instructor/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Manager/i })).toBeVisible();

    await page.getByRole("link", { name: /Instructor/i }).click();
    await expect(page.getByRole("heading", { name: /Today.*Lessons/i })).toBeVisible();

    await page.goto("/swim");
    await page.getByRole("link", { name: /Manager/i }).click();
    await expect(page.getByRole("heading", { name: /Manager Dashboard/i })).toBeVisible();
  });

  test("Free sees Parent and pages load", async ({ page }) => {
    await apiLogin({ username: "free", email: "free@example.com", password: "free" }, page);

    await page.goto("/swim");
    await expect(page.getByRole("heading", { name: /Swim/i })).toBeVisible();

    await expect(page.getByRole("link", { name: /Parent/i })).toBeVisible();
    await page.getByRole("link", { name: /Parent/i }).click();
    await expect(page.getByRole("heading", { name: /My Swimmers/i })).toBeVisible();
  });
});
