import { expect, test, type Page } from "@playwright/test";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1_000) <= 760;
const LOCAL_ACCESS_TOKEN = "focus-log-e2e-test-key-0123456789abcdef";

const chooseNotion = async (page: Page) => {
  if (isMobile(page)) {
    await page.getByRole("button", { name: "Open app menu" }).click();
    await page.getByRole("navigation", { name: "App menu" }).getByRole("button", { name: "Connect Notion", exact: true }).click();
  } else {
    await page.getByRole("button", { name: "Connect Notion", exact: true }).click();
  }
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
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");
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
  test.skip((page.viewportSize()?.width ?? 1_000) > 760, "Mobile navigation is verified in the mobile project.");
  await page.getByRole("button", { name: "Open app menu" }).click();
  await expect(page.getByRole("navigation", { name: "App menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});


test("keeps the edit sheet keyboard focus contained and restores its trigger", async ({ page }) => {
  const editButton = page.getByRole("button", { name: "Edit day" }).filter({ visible: true });
  await editButton.click();
  const dialog = page.getByRole("dialog", { name: "Edit day" });
  await expect(dialog.getByLabel("Big 3 outcome 1")).toBeFocused();
  await dialog.getByRole("button", { name: "Save day" }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close dialog" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Save day" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(editButton).toBeFocused();
});

test("navigates to upcoming notes and saves a new cue", async ({ page }) => {
  await page.getByRole("link", { name: "Upcoming", exact: true }).click();
  await expect(page.getByRole("link", { name: "Upcoming", exact: true })).toHaveAttribute("aria-current", "location");
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add upcoming note" });
  await dialog.getByLabel("Note", { exact: true }).fill("Bring questions to the study group");
  await dialog.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(page.getByText("Bring questions to the study group")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Bring questions to the study group")).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeFocused();
});

test("successful Notion reads disable every local editing control and preserve the demo", async ({ page }) => {
  await page.route("**/api/notion/focus-log?date=*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      date: "2026-08-31", source: "notion",
      daily: [{ id: "mock-daily", title: "Sample read-only plan", date: "2026-08-31", bigThree: "Review the outline\nCheck the references\nPrepare the discussion", nextAction: "Open the reading list", focusHours: 1.5, result: "In progress" }],
      notes: [{ id: "mock-note", title: "Prepare a question", date: "2026-09-01", content: "" }],
      meta: { dailyCount: 1, notesCount: 1 },
    }) });
  });
  await chooseNotion(page);
  await expect(page.getByText("Review the outline", { exact: true })).toBeVisible();
  for (const checkbox of await page.getByRole("checkbox").all()) await expect(checkbox).toBeDisabled();
  await expect(page.getByRole("button", { name: "Edit day" }).filter({ visible: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Increase focus hours" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Decrease focus hours" })).toBeDisabled();
  await expect(page.getByRole("slider", { name: "Set focus hours" })).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Move / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add note", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add reason", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit next action" })).toHaveCount(0);
  await page.getByRole("button", { name: /Demo data \(offline\)/ }).click();
  await expect(page.getByText("Finish the project outline", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Increase focus hours" })).toBeEnabled();
});

test("returns focus to the mobile menu after dismissing Notion pairing", async ({ page }) => {
  test.skip(!isMobile(page), "Compact menu behavior.");
  await page.getByRole("button", { name: "Open app menu" }).click();
  await page.getByRole("navigation", { name: "App menu" }).getByRole("button", { name: "Connect Notion", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Connect Notion" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open app menu" })).toBeFocused();
});
