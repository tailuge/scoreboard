import { test, expect, type Page } from "@playwright/test"

const setUsername = async (page: Page, name: string) => {
  await page.getByLabel(/Edit username:/).click()
  await page.getByLabel("New username").fill(name)
  await page.getByLabel("New username").press("Enter")
  await expect(page.getByLabel(`Edit username: ${name}`)).toBeVisible()
}

test.describe("online user count after back navigation", () => {
  test("confirm online count problem after back navigation", async ({ page }, testInfo) => {
    // Capture console logs for debugging
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warn") {
        console.log(`[PAGE ${msg.type().toUpperCase()}] ${msg.text()}`)
      }
    })

    const suffix = `${testInfo.workerIndex}${Date.now().toString().slice(-4)}`
    const userName = `User${suffix}`

    // 1. Open game.tsx
    await page.goto("/game")

    // Set username to ensure we are "online" and counted
    await setUsername(page, userName)

    // 2. Check that there is at least 1 person online
    const userPill = page.locator('[aria-label*="users online"] span.font-bold')
    
    // We wait for the count to be at least 1 initially
    await expect(async () => {
      const countText = await userPill.innerText()
      const count = Number.parseInt(countText, 10)
      expect(count).toBeGreaterThanOrEqual(1)
    }).toPass({ timeout: 10000 })
    
    const initialCountText = await userPill.innerText()
    console.log(`Initial online count: ${initialCountText}`)

    // 3. Click 'Play vs Bot'
    const playVsBotButton = page.getByRole('link', { name: 'Play vs Bot' }).first()
    await expect(playVsBotButton).toBeVisible()
    
    // Navigate away to the external bot game
    await playVsBotButton.click()
    
    // Check we navigated away
    await expect(page).toHaveURL(/bot=true/)
    console.log("Navigated away from lobby")

    // 4. Wait 2 seconds
    await page.waitForTimeout(2000)

    // 5. Click the browser back button
    await page.goBack()

    // 6. Check that online user count >= 1
    // This part is expected to fail or show 0 if the bug exists
    await expect(page).toHaveURL(/\/game/)
    console.log("Navigated back to lobby, checking online count...")
    
    // Check that the user name is at least restored (shows sessionStorage worked)
    await expect(page.getByLabel(`Edit username: ${userName}`)).toBeVisible({ timeout: 10000 })
    
    // Now check the count. The user believes this is not updated correctly.
    const backCountText = await userPill.innerText()
    const backCount = Number.parseInt(backCountText, 10)
    console.log(`Online count immediately after back navigation: ${backCount}`)
    
    // If this fails, it confirms the problem that the count is not immediately restored/updated.
    expect(backCount).toBeGreaterThanOrEqual(1)
  })
})
