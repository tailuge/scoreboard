import { test, expect } from '@playwright/test';

test('debug connection', async ({ page }) => {
  // Catch console logs from the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Catch failed requests
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });

  // 1. Go to the workbench (now inside Docker on port 80)
  try {
    await page.goto('http://localhost');
  } catch (e) {
    console.log('Could not connect to Nchan server on port 80.');
    return;
  }

  // 2. Wait for a bit to see if connections happen
  await page.waitForTimeout(2000);

  // 3. Inspect the iframes
  const frames = page.frames();
  console.log('Number of frames:', frames.length);

  for (const frame of frames) {
    if (frame.url().includes('client.html')) {
        console.log('Inspecting frame:', frame.url());
        const countText = await frame.innerText('#count');
        console.log('Frame count text:', countText);
    }
  }
});
