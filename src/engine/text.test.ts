import { describe, expect, it } from 'vitest'
import { contentTokens, normalize, stem, tokenize } from './text'

describe('text utilities', () => {
  it('normalizes typographic punctuation', () => {
    expect(normalize('“It’s” 2020–2022\r\n')).toBe(`"It's" 2020-2022\n`)
  })

  it('keeps tech punctuation inside tokens', () => {
    expect(tokenize('Node.js, C++ & CI/CD. Done.')).toEqual(['node.js', 'c++', 'ci', 'cd', 'done'])
  })

  it('stems common suffixes so word forms collide', () => {
    expect(stem('scaling')).toBe(stem('scaled'))
    expect(stem('payments')).toBe('payment')
    expect(stem('libraries')).toBe('library')
    expect(stem('process')).toBe('process')
  })

  it('drops stopwords and job-post filler', () => {
    expect(contentTokens('We are looking for strong experience with payments')).toEqual(['payments'])
  })
})
