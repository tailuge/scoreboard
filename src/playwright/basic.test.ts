import { test, expect } from "@playwright/test"
import { logger } from "../utils/logger"

test("initial page load", async ({ page }) => {
  await page.goto("/test.html")

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
  await page
    .locator("iframe")
    .first()
    .contentFrame()
    .getByRole("button", { name: "Play Nineball" })
    .click()
  await page
    .locator("iframe")
    .nth(1)
    .contentFrame()
    .getByLabel("Join Table")
    .click()
  await expect(
    page
      .locator("iframe")
      .first()
      .contentFrame()
      .getByRole("button", { name: "Start" })
  ).toBeVisible()
})
