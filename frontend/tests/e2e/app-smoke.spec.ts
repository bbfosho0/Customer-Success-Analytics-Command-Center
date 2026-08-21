import { expect, test } from "@playwright/test";

const routes = [
  "/dashboard",
  "/calls",
  "/calls/CALL_0001",
  "/agents",
  "/metrics",
  "/customer-analytics",
  "/settings",
];

for (const route of routes) {
  test(`${route} renders without an application crash`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText("Application error")).toHaveCount(0);
  });
}

test("dashboard navigation opens Calls", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Calls", exact: true }).click();
  await expect(page).toHaveURL(/\/calls\/?$/);
  await expect(page.getByRole("heading", { name: "Calls", exact: true })).toBeVisible();
});
