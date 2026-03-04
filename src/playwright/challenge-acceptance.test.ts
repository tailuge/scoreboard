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

      await Promise.all([page1.goto("/game"), page2.goto("/game")])

      await setUsername(page1, aliceName)
      await setUsername(page2, bobName)

      await openOnlineUsers(page1)
      await expect(
        page1.getByLabel("Online users").getByText(bobName, { exact: false })
      ).toBeVisible({ timeout: 20_000 })

      const bobRow = page1.locator("li").filter({ hasText: bobName }).first()
      await bobRow.getByRole("button", { name: "Challenge" }).click()
      await page1.waitForURL(/\/lobby/)

      // Alice selects a rule type
      await page1.getByRole("button", { name: "Nine Ball" }).click()

      const challengeButton = page2.getByRole("button", {
        name: `Challenge from ${aliceName}`,
      })
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
