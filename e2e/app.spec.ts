import { expect, test } from '@playwright/test'
import { SAMPLE_JOB, SAMPLE_RESUME } from '../src/samples'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('analyzes the sample and explains the score', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Check my fit' })).toBeDisabled()
  await page.getByRole('button', { name: 'Try a sample' }).click()

  const score = Number(await page.getByTestId('score').textContent())
  expect(score).toBeGreaterThan(40)
  expect(score).toBeLessThanOrEqual(100)

  await expect(page.getByRole('heading', { name: 'Top fixes' })).toBeVisible()
  await expect(page.getByText(/^Missing core skills:/)).toBeVisible()
  await expect(page.getByTestId('component-semantic')).toContainText('n/a')
  await expect(page.locator('.chip-bad', { hasText: 'Agile' })).toBeVisible()
  await expect(page.locator('.chip-good', { hasText: 'Kubernetes' })).toBeVisible()
  await expect(page.getByText('Try:').first()).toBeVisible()
})

test('updates live as the resume is edited', async ({ page }) => {
  await page.getByRole('button', { name: 'Try a sample' }).click()
  const before = Number(await page.getByTestId('score').textContent())
  await page.getByRole('textbox', { name: 'Your resume' }).fill(SAMPLE_RESUME.replace('Kubernetes', 'Mainframes').replaceAll('Kubernetes', 'COBOL'))
  await expect.poll(async () => Number(await page.getByTestId('score').textContent())).toBeLessThan(before)
})

test('remembers inputs across reloads', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Job description' }).fill('Need Rust and Kafka')
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Job description' })).toHaveValue('Need Rust and Kafka')
})

test('reads a PDF resume entirely in the browser', async ({ page, browser }) => {
  // Render the sample resume to a real PDF with Chromium, then upload it.
  const printer = await browser.newPage()
  const html = SAMPLE_RESUME.split('\n')
    .map((l) => `<p style="margin:0 0 4px;font:12px sans-serif">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
    .join('')
  await printer.setContent(html)
  const pdf = await printer.pdf({ format: 'A4' })
  await printer.close()

  await page.getByRole('textbox', { name: 'Job description' }).fill(SAMPLE_JOB)
  await page.getByTestId('resume-file').setInputFiles({ name: 'resume.pdf', mimeType: 'application/pdf', buffer: pdf })
  await expect(page.getByRole('textbox', { name: 'Your resume' })).toHaveValue(/Engineered a Spring Boot order service/)
  await page.getByRole('button', { name: 'Check my fit' }).click()
  await expect(page.locator('.chip-good', { hasText: 'Redis' })).toBeVisible()
})

test('exports a Markdown report', async ({ page }) => {
  await page.getByRole('button', { name: 'Try a sample' }).click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download report' }).click()])
  expect(download.suggestedFilename()).toBe('fitcheck-report.md')
  const text = await (await download.createReadStream()).toArray()
  expect(Buffer.concat(text).toString()).toMatch(/^# FitCheck report: \d+\/100/)
})

test('fits a phone screen without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.getByRole('button', { name: 'Try a sample' }).click()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('switches theme and keeps the choice', async ({ page }) => {
  const toggle = page.getByRole('button', { name: /^Theme:/ })
  await toggle.click()
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
