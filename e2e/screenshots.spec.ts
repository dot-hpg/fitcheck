import { expect, test } from '@playwright/test'

/**
 * Regenerates the README screenshots in docs/. Not part of the normal run:
 * `SCREENSHOTS=1 npx playwright test screenshots`. With FITCHECK_MODEL_DIR set,
 * the AI evidence shot uses the real model (see ai.spec.ts for the routing).
 */
test.skip(!process.env.SCREENSHOTS, 'Set SCREENSHOTS=1 to regenerate docs/ images')

test.use({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2, colorScheme: 'light' })

test('readme screenshots', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try a sample' }).click()
  await page.waitForTimeout(900)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'docs/hero.png' })

  await page.locator('.overview').screenshot({ path: 'docs/score.png' })
  await page.locator('section', { has: page.getByRole('heading', { name: 'Bullet coach' }) }).screenshot({ path: 'docs/bullets.png' })

  await page.emulateMedia({ colorScheme: 'dark' })
  await page.waitForTimeout(300)
  await page.locator('.overview').screenshot({ path: 'docs/score-dark.png' })
  await page.emulateMedia({ colorScheme: 'light' })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.overview').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'docs/mobile.png' })
  await expect(page.getByTestId('score')).toBeVisible()
})
