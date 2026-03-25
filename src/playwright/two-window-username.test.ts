import { test, expect, type Page } from "@playwright/test"

const setUsername = async (page: Page, name: string) => {
  await page.getByLabel(/Edit username:/).click()
  await page.getByLabel("New username").fill(name)
  await page.getByLabel("New username").press("Enter")
  await expect(page.getByLabel(`Edit username: ${name}`)).toBeVisible()
}

const waitForUserOnline = async (page: Page, name: string) => {
  await expect(
    page.locator(".stagger-item").filter({ hasText: name }).first()
  ).toBeVisible({ timeout: 10_000 })
}

test.describe("two window username test", () => {
  test("Alice and Bob should see each other in online users list", async ({
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

      await waitForUserOnline(page1, bobName)
      await waitForUserOnline(page2, aliceName)
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})
