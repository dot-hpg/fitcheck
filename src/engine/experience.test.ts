import { describe, expect, it } from 'vitest'
import { estimateYears, findDateRanges, totalYears } from './experience'

const now = new Date('2026-10-15')

describe('experience', () => {
  it('parses many date formats', () => {
    const labels = findDateRanges('Jan 2020 - Mar 2021 | 06/2021 – 08/2022 | 2015 to 2016 | Sept 2023 - Present', now).map(
      (r) => r.label,
    )
    expect(labels).toHaveLength(4)
  })

  it('sums ranges inclusively', () => {
    expect(estimateYears('Jan 2020 - Dec 2020', now)).toBe(1)
  })

  it('merges overlapping roles', () => {
    expect(estimateYears('Jan 2020 - Dec 2021\nJun 2021 - Dec 2022', now)).toBe(3)
  })

  it('treats Present as now and ignores future starts', () => {
    expect(estimateYears('Oct 2025 - Present', now)).toBe(1.1)
    expect(estimateYears('Jan 2030 - Present', now)).toBe(0)
  })

  it('returns zero with no ranges', () => {
    expect(totalYears([])).toBe(0)
  })
})
