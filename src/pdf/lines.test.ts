import { describe, expect, it } from 'vitest'
import { itemsToLines, type PdfTextItem } from './lines'

const run = (str: string, x: number, y: number, width = str.length * 5, height = 10): PdfTextItem => ({
  str,
  transform: [height, 0, 0, height, x, y],
  width,
  height,
})

describe('itemsToLines', () => {
  it('orders lines top to bottom and runs left to right', () => {
    const lines = itemsToLines([run('Second', 0, 680), run('line', 40, 680), run('First', 0, 700)])
    expect(lines).toEqual(['First', 'Second line'])
  })

  it('merges runs with slightly different baselines', () => {
    expect(itemsToLines([run('Jan 2022', 300, 500.8), run('Engineer', 0, 500)])).toEqual(['Engineer Jan 2022'])
  })

  it('does not insert spaces inside tightly kerned words', () => {
    expect(itemsToLines([run('Kuber', 0, 10, 25), run('netes', 25, 10)])).toEqual(['Kubernetes'])
  })

  it('drops whitespace-only runs', () => {
    expect(itemsToLines([run('  ', 0, 10), run('Hi', 10, 10)])).toEqual(['Hi'])
  })
})
