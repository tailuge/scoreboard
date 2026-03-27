import { test, expect, type Page } from "@playwright/test"

const setUsername = async (page: Page, name: string) => {
  await page.getByLabel(/Edit username:/).click()
  await page.getByLabel("New username").fill(name)
  await page.getByLabel("New username").press("Enter")
  await expect(page.getByLabel(`Edit username: ${name}`)).toBeVisible()
}

const waitForUserOnline = async (page: Page, name: string) => {
  await expect(
    page.locator(`[aria-label="Challenge ${name}"]`).first()
  ).toBeVisible({ timeout: 10_000 })
}

test.describe.serial("challenge acceptance test", () => {
  test("challenge should launch with challenger going first", async ({
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

      await page1.locator(`[aria-label="Challenge ${bobName}"]`).first().click()

      await page1.getByRole("button", { name: "Play nineball" }).click()

      const acceptButton = page2.getByRole("button", {
        name: "Accept challenge",
      })
      await expect(acceptButton).toBeVisible({ timeout: 10_000 })
      const page1GameUrl = page1.waitForURL(
        /billiards\.tailuge\.workers\.dev/,
        {
          timeout: 10_000,
        }
      )
      const page2GameUrl = page2.waitForURL(
        /billiards\.tailuge\.workers\.dev/,
        {
          timeout: 10_000,
        }
      )

      await acceptButton.click()

      await Promise.all([page1GameUrl, page2GameUrl])

      const page1Url = new URL(page1.url())
      const page2Url = new URL(page2.url())

      expect(page1Url.searchParams.get("first")).toBe("true")
      expect(page2Url.searchParams.get("first")).toBeNull()
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})
