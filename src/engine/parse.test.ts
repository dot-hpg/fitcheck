import { describe, expect, it } from 'vitest'
import { parseJob, parseResume } from './parse'

describe('parseJob', () => {
  const job = parseJob(`About Acme
We are a friendly company with great benefits.

Requirements:
- 3+ years of experience building web apps
- React and TypeScript

Nice to have
- GraphQL

Responsibilities
- Ship features weekly; Docker is a plus`)

  it('labels lines by section', () => {
    const section = (needle: string) => job.lines.find((l) => l.text.includes(needle))?.section
    expect(section('friendly')).toBe('info')
    expect(section('React')).toBe('required')
    expect(section('GraphQL')).toBe('preferred')
    expect(section('Ship features')).toBe('preferred')
  })

  it('strips bullet markers', () => {
    expect(job.lines.some((l) => l.text === 'React and TypeScript')).toBe(true)
  })

  it('reads the minimum years of experience', () => {
    expect(job.minYears).toBe(3)
    expect(parseJob('Need 2-4 yrs of industry experience').minYears).toBe(2)
    expect(parseJob('Founded 10 years ago').minYears).toBeNull()
  })
})

describe('parseResume', () => {
  const resume = parseResume(`Jane Doe
EXPERIENCE
Engineer, Foo Corp, Jan 2022 - Present
• Built a billing service that processes 2M invoices a month
  and cut failed payments by 12%
• Wrote docs
Led the migration of our monolith to event-driven services across four teams
SKILLS
Python, SQL`)

  it('splits sections by heading', () => {
    expect(resume.sections.skills).toEqual(['Python, SQL'])
    expect(resume.sections.summary).toEqual(['Jane Doe'])
  })

  it('extracts bullets, joins wrapped lines and skips meta lines', () => {
    expect(resume.bullets).toEqual([
      'Built a billing service that processes 2M invoices a month and cut failed payments by 12%',
      'Led the migration of our monolith to event-driven services across four teams',
    ])
  })
})
