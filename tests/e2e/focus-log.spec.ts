import { expect, test, type Page } from "@playwright/test";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1_000) <= 600;
const LOCAL_ACCESS_TOKEN = "focus-log-e2e-test-key-0123456789abcdef";

const chooseNotion = async (page: Page) => {
  if (isMobile(page)) {
    await page.getByRole("button", { name: "Open app menu" }).click();
  }
  await page.getByRole("button", { name: "Connect Notion", exact: true }).click();
  const accessDialog = page.getByRole("dialog", { name: "Connect Notion" });
  if (await accessDialog.isVisible().catch(() => false)) {
    await accessDialog.getByLabel("Local access key").fill(LOCAL_ACCESS_TOKEN);
    await accessDialog.getByRole("button", { name: "Connect read-only" }).click();
  }
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("edits the day, tracks progress, and persists local changes", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Monday, Aug 31");
  await page.getByRole("checkbox", { name: /Review two practice sets/ }).check();
  await page.getByRole("button", { name: "Increase focus hours" }).click();
  await page.getByRole("button", { name: "Edit day" }).first().click();

  const firstOutcome = page.getByLabel("Big 3 outcome 1");
  await firstOutcome.fill("Publish the project README");
  await page.getByRole("button", { name: "Save day" }).click();

  await expect(page.getByText("Publish the project README")).toBeVisible();
  await expect(page.getByText("3.0", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Publish the project README")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Review two practice sets/ })).toBeChecked();
});

test("keeps demo data usable when the optional Notion server is unavailable", async ({ page }) => {
  await page.route("**/api/notion/focus-log?date=*", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "NOTION_NOT_CONFIGURED",
          message: "Notion read-only integration is not configured.",
        },
      }),
    });
  });

  await chooseNotion(page);
  await expect(page.getByRole("status")).toContainText("Notion is unavailable");
  await expect(page.getByText("Finish the project outline")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit day" }).first()).toBeEnabled();
});

test("exposes the compact app menu on a narrow viewport", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1_000) > 600, "Mobile navigation is verified in the mobile project.");
  await page.getByRole("button", { name: "Open app menu" }).click();
  await expect(page.getByRole("navigation", { name: "App menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
