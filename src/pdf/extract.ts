import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { itemsToLines, type PdfTextItem } from './lines'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/** Extracts plain text from a PDF entirely in the browser. Nothing is uploaded. */
export async function extractPdfText(file: File): Promise<string> {
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  try {
    const doc = await task.promise
    const pages: string[] = []
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const content = await page.getTextContent()
      pages.push(itemsToLines(content.items.filter((i): i is PdfTextItem & typeof i => 'str' in i)).join('\n'))
    }
    return pages.join('\n')
  } finally {
    await task.destroy()
  }
}
