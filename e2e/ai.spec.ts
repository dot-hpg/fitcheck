import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * Runs the real on-device model end to end. Model files are served from disk
 * (FITCHECK_MODEL_DIR, see README) instead of Hugging Face, so the test is
 * deterministic and works offline. Skipped when the folder is not set.
 */
const modelDir = process.env.FITCHECK_MODEL_DIR
const MODEL_PORT = 8099

test.describe('on-device AI', () => {
  test.skip(!modelDir, 'Set FITCHECK_MODEL_DIR to run the real-model test')
  let server: Server

  test.beforeAll(async () => {
    server = createServer((req, res) => {
      let file = decodeURIComponent((req.url ?? '').split('?')[0])
      // Only the fp32 export may be on disk; it is a drop-in for the quantised file.
      if (!existsSync(join(modelDir!, file))) file = file.replace('model_quantized.onnx', 'model.onnx')
      const path = join(modelDir!, file)
      if (!path.startsWith(modelDir!) || !existsSync(path)) {
        res.writeHead(404, { 'access-control-allow-origin': '*' }).end()
        return
      }
      res.writeHead(200, { 'access-control-allow-origin': '*', 'content-length': statSync(path).size })
      createReadStream(path).pipe(res)
    })
    await new Promise<void>((resolve) => server.listen(MODEL_PORT, resolve))
  })

  test.afterAll(() => server?.close())
  test.use({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2, colorScheme: 'light' })

  test('finds evidence for requirements and adds it to the score', async ({ page, context }) => {
    test.setTimeout(180_000)
    // Redirect instead of fulfilling: model files are too big for the DevTools pipe.
    await context.route(/huggingface\.co\/.*\/resolve\/main\//, (route) => {
      const file = route.request().url().split('/resolve/main/')[1].split('?')[0]
      return route.fulfill({
        status: 302,
        headers: { location: `http://localhost:${MODEL_PORT}/Xenova/all-MiniLM-L6-v2/${file}`, 'access-control-allow-origin': '*' },
      })
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Try a sample' }).click()
    await expect(page.getByTestId('component-semantic')).toContainText('n/a')
    await page.getByRole('button', { name: 'Run AI check' }).click()

    const evidence = page.getByTestId('evidence')
    await expect(evidence).toBeVisible({ timeout: 150_000 })
    const restRow = evidence.locator('li', { hasText: 'Experience designing RESTful APIs' })
    await expect(restRow).toContainText('Designed RESTful APIs backed by PostgreSQL')
    await expect(restRow.locator('.badge')).toHaveText('Strong')
    await expect(page.getByTestId('component-semantic')).not.toContainText('n/a')
    if (process.env.SCREENSHOTS) {
      await page.locator('section', { has: page.getByRole('heading', { name: 'Requirement evidence' }) }).screenshot({ path: 'docs/ai-evidence.png' })
    }

    // Editing the text marks the AI result as stale instead of showing outdated evidence.
    await page.getByRole('textbox', { name: 'Your resume' }).press('End')
    await page.getByRole('textbox', { name: 'Your resume' }).pressSequentially(' x')
    await expect(page.getByText('Your text changed since the last AI check.')).toBeVisible()
  })
})
