import { test, expect, type Page } from "@playwright/test"

const setUsername = async (page: Page, name: string) => {
  await page.getByLabel(/Edit username:/).click()
  await page.getByLabel("New username").fill(name)
  await page.getByLabel("New username").press("Enter")
  await expect(page.getByLabel(`Edit username: ${name}`)).toBeVisible()
}

const openOnlineUsers = async (page: Page) => {
  await page.getByLabel(/users online/).click()
  await expect(page.getByLabel("Online users")).toBeVisible()
}

test.describe("challenge acceptance test", () => {
  test("challenge icon should disappear after game pairing", async ({
    browser,
  }, testInfo) => {
    const suffix = `${testInfo.workerIndex}${Date.now().toString().slice(-4)}`
    const aliceName = `A${suffix}`
    const bobName = `B${suffix}`
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    try {
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      const mockKV = async (page: Page) => {
        await page.route("**/api/tables**", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
          })
        )
        await page.route("**/api/usage/**", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true }),
          })
        )
        await page.route("**/api/rank**", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
          })
        )
        await page.route("**/api/match-results**", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
          })
        )
      }

      await mockKV(page1)
      await mockKV(page2)

      await Promise.all([
        page1.goto("/game", { waitUntil: "networkidle" }),
        page2.goto("/game", { waitUntil: "networkidle" }),
      ])

      await setUsername(page1, aliceName)
      await setUsername(page2, bobName)

      await openOnlineUsers(page1)
      await expect(
        page1.getByLabel("Online users").getByText(bobName, { exact: false })
      ).toBeVisible({ timeout: 20_000 })

      const bobRow = page1.locator("li").filter({ hasText: bobName }).first()
      await bobRow.getByRole("button", { name: "Challenge" }).click()
      await page1.waitForURL(/\/lobby/)

      const challengeButton = page2.getByRole("button", {
        name: `Challenge from ${aliceName}`,
      })

      // Verify challenge is NOT visible while Alice is selecting rule
      await expect(challengeButton).not.toBeVisible({ timeout: 5000 })

      // Alice selects a rule
      await page1.getByRole("button", { name: "Snooker" }).click()

      // Verify challenge is visible after Alice selects rule
      await expect(challengeButton).toBeVisible({ timeout: 20_000 })
      await challengeButton.click()

      await page2.waitForURL(/\/lobby/)
      await page2.goto("/game")

      await expect(
        page2.getByRole("button", { name: `Challenge from ${aliceName}` })
      ).not.toBeVisible({ timeout: 20_000 })
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})
