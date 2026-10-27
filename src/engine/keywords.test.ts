import { describe, expect, it } from 'vitest'
import { keywordCoverage, topKeywords } from './keywords'

describe('keywords', () => {
  const job = 'Acme Payments is hiring. You will own payments reconciliation, payment disputes and fraud detection using Python.'

  it('ranks repeated domain words and skips skills, filler and names', () => {
    const terms = [...topKeywords(job).values()].map((k) => k.term)
    expect(terms[0]).toBe('payments')
    expect(terms).toEqual(expect.arrayContaining(['reconciliation', 'fraud', 'detection', 'disputes']))
    expect(terms).not.toContain('python')
    expect(terms).not.toContain('acme')
    expect(terms).not.toContain('hiring')
  })

  it('scores weighted coverage using stems', () => {
    const { score, keywords } = keywordCoverage(job, 'Built a fraud detector and a payment reconciler')
    expect(keywords.find((k) => k.term === 'payments')?.found).toBe(true)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })

  it('returns null when the job has no keywords', () => {
    expect(keywordCoverage('', 'anything').score).toBeNull()
  })
})
