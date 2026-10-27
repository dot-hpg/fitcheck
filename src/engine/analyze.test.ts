import { describe, expect, it } from 'vitest'
import { SAMPLE_JOB, SAMPLE_RESUME } from '../samples'
import { analyze, evidenceLines, requirementLines, verdictFor } from './analyze'
import { toMarkdown } from './report'

const now = new Date('2026-10-27')

describe('analyze', () => {
  const a = analyze(SAMPLE_JOB, SAMPLE_RESUME, { now })

  it('produces a bounded score and verdict', () => {
    expect(a.score).toBeGreaterThan(50)
    expect(a.score).toBeLessThanOrEqual(100)
    expect(a.verdict).toBe(verdictFor(a.score))
  })

  it('separates core and nice-to-have skills', () => {
    const find = (name: string) => a.skills.find((m) => m.skill.name === name)
    expect(find('Java')).toMatchObject({ importance: 'required', inResume: true })
    expect(find('Terraform')).toMatchObject({ importance: 'preferred', inResume: true })
    expect(find('Agile')).toMatchObject({ importance: 'required', inResume: false })
  })

  it('ignores benefits and company blurbs', () => {
    expect(a.keywords.map((k) => k.term)).not.toContain('insurance')
  })

  it('notices skills that are only listed, never shown in use', () => {
    expect(a.skills.find((m) => m.skill.id === 'dsa')?.listedOnly).toBe(true)
  })

  it('estimates experience against the stated minimum', () => {
    expect(a.years).toEqual({ required: 2, estimated: 3.8 })
  })

  it('leaves the AI component out until semantic results exist', () => {
    expect(a.components.find((c) => c.key === 'semantic')?.score).toBeNull()
    const withAi = analyze(SAMPLE_JOB, SAMPLE_RESUME, { now, semantic: { evidence: [], score: 0 } })
    expect(withAi.score).toBeLessThan(a.score)
  })

  it('writes concrete recommendations', () => {
    expect(a.recommendations[0]).toMatch(/^Missing core skills: Agile/)
    expect(a.recommendations.length).toBeGreaterThan(2)
  })

  it('scores an empty resume as a low match without crashing', () => {
    const empty = analyze(SAMPLE_JOB, '', { now })
    expect(empty.verdict).toBe('Low match')
    expect(empty.bullets).toEqual([])
  })

  it('feeds sensible lines to the semantic matcher', () => {
    const reqs = requirementLines(SAMPLE_JOB)
    expect(reqs).toContain('Improve reliability and latency of the checkout flow')
    expect(reqs.some((r) => r.includes('Health insurance'))).toBe(false)
    expect(evidenceLines(SAMPLE_RESUME).length).toBeGreaterThan(5)
  })
})

describe('toMarkdown', () => {
  it('renders a shareable report', () => {
    const md = toMarkdown(analyze(SAMPLE_JOB, SAMPLE_RESUME, { now }), now)
    expect(md).toMatch(/^# FitCheck report: \d+\/100/)
    expect(md).toContain('| Core skills |')
    expect(md).toContain('**Try:**')
  })
})

describe('verdictFor', () => {
  it.each([
    [92, 'Strong match'],
    [70, 'Good match'],
    [50, 'Fair match'],
    [10, 'Low match'],
  ] as const)('%i -> %s', (score, verdict) => expect(verdictFor(score)).toBe(verdict))
})
