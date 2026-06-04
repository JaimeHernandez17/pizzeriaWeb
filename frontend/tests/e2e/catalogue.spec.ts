import { test, expect } from "@playwright/test";

test("catalogue page renders successfully", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Pizzer/);
});
