import { describe, expect, it } from 'vitest'
import { cosine, levelFor, semanticEvidence, type Embedder } from './semantic'

/** A toy embedder: each topic word is one dimension, so similarity is predictable. */
const TOPICS = ['api', 'database', 'kubernetes', 'team']
const fakeEmbed: Embedder = async (texts) =>
  texts.map((t) => [...TOPICS.map((w) => (t.toLowerCase().includes(w) ? 1 : 0)), 0.0001])

describe('semantic evidence', () => {
  it('computes cosine similarity', () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1)
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0)
    expect(cosine([0, 0], [1, 1])).toBe(0)
  })

  it('maps similarity to levels', () => {
    expect([levelFor(0.7), levelFor(0.45), levelFor(0.1)]).toEqual(['strong', 'partial', 'gap'])
    expect(levelFor(0.3996)).toBe('partial')
  })

  it('pairs each requirement with its closest resume line', async () => {
    const result = await semanticEvidence(
      ['Design a public API', 'Run workloads on Kubernetes', 'Lead a team'],
      ['Shipped an API used by 300 merchants', 'Moved 14 services to Kubernetes'],
      fakeEmbed,
    )
    expect(result.evidence.map((e) => e.match)).toEqual([
      'Shipped an API used by 300 merchants',
      'Moved 14 services to Kubernetes',
      null,
    ])
    expect(result.evidence[2].level).toBe('gap')
    expect(result.score).toBeCloseTo(2 / 3)
  })

  it('handles empty inputs', async () => {
    expect(await semanticEvidence([], ['x'], fakeEmbed)).toEqual({ evidence: [], score: 0 })
  })
})
