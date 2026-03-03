import { test, expect } from "@playwright/test"

test.describe("two window username test", () => {
  test("Alice and Bob should see each other in online users list", async ({
    browser,
  }) => {
    // Create two separate browser contexts (windows)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Navigate both to the game page
    await page1.goto("/game")
    await page2.goto("/game")

    // Wait for pages to load
    await page1.waitForLoadState("networkidle")
    await page2.waitForLoadState("networkidle")

    // Set username to Alice in window 1
    // Click the edit username button
    await page1.getByLabel(/Edit username:/).click()

    // Type Alice in the input field
    await page1.getByLabel("New username").fill("Alice")

    // Press Enter to save
    await page1.getByLabel("New username").press("Enter")

    // Verify username changed
    await expect(page1.getByText("Alice")).toBeVisible()

    // Set username to Bob in window 2
    await page2.getByLabel(/Edit username:/).click()

    await page2.getByLabel("New username").fill("Bob")

    await page2.getByLabel("New username").press("Enter")

    // Verify username changed
    await expect(page2.getByText("Bob")).toBeVisible()

    // Wait 5 seconds for presence list to sync
    await page1.waitForTimeout(5000)

    // Click the online users button on both windows to open the popover
    // The button has aria-label showing count of users online
    await page1.getByLabel(/users online/).click()

    await page2.getByLabel(/users online/).click()

    // Wait for popovers to open
    await page1.waitForTimeout(500)
    await page2.waitForTimeout(500)

    // Alice should see Bob in her online users list
    await expect(
      page1.getByLabel("Online users").getByText("Bob")
    ).toBeVisible()

    // Bob should see Alice in his online users list
    await expect(
      page2.getByLabel("Online users").getByText("Alice")
    ).toBeVisible()

    // Cleanup
    await context1.close()
    await context2.close()
  })
})
