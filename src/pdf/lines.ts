/** The subset of pdf.js TextItem fields we need. */
export interface PdfTextItem {
  str: string
  /** [scaleX, skewY, skewX, scaleY, x, y]; y grows upwards in PDF space. */
  transform: number[]
  width: number
  height: number
}

/**
 * Rebuilds reading-order lines from positioned text runs. pdf.js returns runs
 * in content-stream order, which for many resume templates is not the order
 * a person reads, so we group by baseline and sort left to right.
 */
export function itemsToLines(items: PdfTextItem[]): string[] {
  const runs = items.filter((i) => i.str.trim() !== '')
  const rows: { y: number; size: number; items: PdfTextItem[] }[] = []
  for (const item of runs) {
    const y = item.transform[5]
    const size = item.height || Math.abs(item.transform[3]) || 10
    // Runs whose baselines differ by less than ~40% of the font size share a line.
    const row = rows.find((r) => Math.abs(r.y - y) < Math.max(r.size, size) * 0.4)
    if (row) row.items.push(item)
    else rows.push({ y, size, items: [item] })
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => {
      const sorted = row.items.sort((a, b) => a.transform[4] - b.transform[4])
      let line = ''
      let lastEnd = -Infinity
      for (const item of sorted) {
        const x = item.transform[4]
        // A visible gap between runs means a space the PDF did not encode.
        const gap = x - lastEnd > row.size * 0.15
        line += (line && gap && !line.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str
        lastEnd = x + item.width
      }
      return line.replace(/\s+/g, ' ').trim()
    })
    .filter(Boolean)
}
