import { test, expect } from "@playwright/test";

test.describe("challenge acceptance test", () => {
  test("challenge icon should disappear after game pairing", async ({
    browser,
  }) => {
    // Create two separate browser contexts (windows)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Navigate both to the game page
    await page1.goto("/game");
    await page2.goto("/game");

    // Wait for pages to load
    await page1.waitForLoadState("networkidle");
    await page2.waitForLoadState("networkidle");

    // Set username to Alice in window 1
    await page1.getByLabel(/Edit username:/).click();
    await page1.getByLabel("New username").fill("Alice");
    await page1.getByLabel("New username").press("Enter");
    await expect(page1.getByText("Alice")).toBeVisible();

    // Set username to Bob in window 2
    await page2.getByLabel(/Edit username:/).click();
    await page2.getByLabel("New username").fill("Bob");
    await page2.getByLabel("New username").press("Enter");
    await expect(page2.getByText("Bob")).toBeVisible();

    // Wait 5 seconds for presence list to sync
    await page1.waitForTimeout(5000);

    // Alice opens the online users popover and sends a challenge to Bob
    await page1.getByLabel(/users online/).click();
    await page1.waitForTimeout(1000);

    // Wait for Bob to appear in Alice's list (within the Online users popover)
    await expect(page1.getByLabel("Online users").getByText("Bob")).toBeVisible(
      { timeout: 10000 },
    );

    // Click the Challenge button that's in the same list item as Bob
    const bobRow = page1.locator("li").filter({ hasText: "Bob" }).first();
    await bobRow.getByRole("button", { name: "Challenge" }).click();

    // Wait for Alice's lobby to load
    await page1.waitForURL(/\/lobby/);
    await page1.waitForLoadState("networkidle");

    // Wait for presence to sync (Alice's presence with opponentId should reach Bob)
    await page1.waitForTimeout(3000);

    // Bob should see the challenge icon on the game page
    const challengeButton = page2.getByText("Challenge from Alice");
    await expect(challengeButton).toBeVisible();

    // Bob accepts the challenge
    await challengeButton.click();

    // Wait for Bob's lobby to load
    await page2.waitForURL(/\/lobby/);
    await page2.waitForLoadState("networkidle");

    // Wait for the game pairing to complete (modal appears)
    // The test needs to wait for the modal to appear, which indicates pairing is done
    await page2.waitForTimeout(3000);

    // Bob's incoming challenge should disappear after the game is paired
    // The presence message will no longer have opponentId set
    await page2.waitForTimeout(5000);

    // The challenge icon should no longer be visible on Bob's game page
    // Navigate back to game page to check
    await page2.goto("/game");
    await page2.waitForLoadState("networkidle");
    await page2.waitForTimeout(3000);

    // Challenge button should not be visible anymore
    await expect(page2.getByText("Challenge from Alice")).not.toBeVisible();

    // Cleanup
    await context1.close();
    await context2.close();
  });
});
