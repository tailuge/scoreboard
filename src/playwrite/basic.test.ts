import { test, expect } from "@playwright/test"
import { logger } from "../utils/logger"

test("initial page load", async ({ page }) => {
  // Mock API calls that might happen in the lobby
  await page.route("**/api/tables", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    })
  })
  await page.route("**/api/match-results", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    })
  })

  await page.goto("/test.html")

  // Click a button to show iframes
  await page.locator("#button-nineball").click()

  // Wait for the iframes to load
  await page.waitForSelector("iframe")

  // Debug: Log the body content
  const bodyContent = await page.locator("body").innerHTML()
  logger.log("Body Content:", bodyContent)

  // Wait for the container to load
  await page.waitForSelector(".container")

  // Check that the container is visible
  await expect(page.locator(".container")).toBeVisible()

  // Check that there are 3 panels
  await expect(page.locator(".panel")).toHaveCount(3)
})

test("create and join", async ({ page }) => {
  await page.goto("/test.html")
  await page.locator("#button-nineball").click()

  // Wait for the iframes to be created and loaded
  await page.waitForSelector("iframe")
  const iframe1 = page.frameLocator("iframe").first()

  // Just verify the play button is present in the iframe
  await expect(iframe1.getByLabel("Play Nine Ball Online")).toBeAttached({ timeout: 15000 })
})
