import { describe, expect, it } from 'vitest'
import { analyzeBullet, suggestVerb } from './bullets'

describe('analyzeBullet', () => {
  it('gives full marks to a strong, quantified bullet', () => {
    const r = analyzeBullet('Reduced checkout latency by 40% by adding a Redis cache in front of the pricing service')
    expect(r).toMatchObject({ score: 100, issues: [], suggestion: null })
  })

  it('flags passive openers and rewrites them with a fitting verb', () => {
    const r = analyzeBullet('Responsible for building the payments API for 3 partner banks')
    expect(r.issues).toEqual(['weak-opener'])
    expect(r.suggestion).toBe('Engineered the payments API for 3 partner banks.')
  })

  it('drops the helper verb after "helped"', () => {
    expect(analyzeBullet('Helped improve slow SQL queries on the reports page by 30%').suggestion).toBe(
      'Optimized slow SQL queries on the reports page by 30%.',
    )
  })

  it('flags missing metrics and adds a placeholder', () => {
    const r = analyzeBullet('Designed a component library used across the dashboard and admin pages')
    expect(r.issues).toEqual(['no-metric'])
    expect(r.suggestion).toMatch(/\[improving <metric>/)
  })

  it('flags first-person pronouns and vague one-liners', () => {
    const r = analyzeBullet('I fixed bugs')
    expect(r.issues).toEqual(expect.arrayContaining(['first-person', 'too-short', 'no-metric']))
    expect(r.suggestion?.startsWith('Fixed bugs')).toBe(true)
  })

  it('flags bullets that ramble', () => {
    expect(analyzeBullet(`Built ${'many small things '.repeat(14)}for 5 teams`).issues).toContain('too-long')
  })

  it('never scores below zero', () => {
    expect(analyzeBullet('I was part of stuff').score).toBeGreaterThanOrEqual(0)
  })
})

describe('suggestVerb', () => {
  it.each([
    ['unit tests for the parser', 'Automated'],
    ['mentoring two interns', 'Led'],
    ['the latency of search', 'Optimized'],
    ['a REST api for orders', 'Engineered'],
    ['something else entirely', 'Built'],
  ])('%s -> %s', (text, verb) => expect(suggestVerb(text)).toBe(verb))
})
