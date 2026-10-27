/**
 * Estimates total professional experience from the date ranges on a resume.
 * Overlapping roles are merged so two concurrent jobs are not double counted.
 */

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
}

const MONTH_NAME = '(?:jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\\.?'
const POINT = `(?:${MONTH_NAME}\\s*'?\\d{2,4}|\\d{1,2}\\s*/\\s*\\d{2,4}|(?:19|20)\\d{2})`
const END = `(?:${POINT}|present|current|now|today|ongoing)`
const RANGE = new RegExp(`(${POINT})\\s*(?:-|to|until|\\u2013|\\u2014)\\s*(${END})`, 'gi')

/** Month index since year 0, so ranges are simple integer intervals. */
function toMonth(token: string, now: Date, isEnd: boolean): number | null {
  const t = token.toLowerCase().trim()
  if (/^(present|current|now|today|ongoing)$/.test(t)) return now.getFullYear() * 12 + now.getMonth()

  const year = (y: string) => {
    const n = Number(y)
    return y.length === 2 ? 2000 + n : n
  }
  let m = t.match(/^([a-z]+)\.?\s*'?(\d{2,4})$/)
  if (m) {
    const month = MONTHS[m[1].slice(0, m[1].startsWith('sept') ? 4 : 3)]
    return month === undefined ? null : year(m[2]) * 12 + month
  }
  m = t.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/)
  if (m) {
    const month = Number(m[1]) - 1
    return month < 0 || month > 11 ? null : year(m[2]) * 12 + month
  }
  m = t.match(/^(\d{4})$/)
  // A bare year as an end point means "sometime that year"; count it to the end.
  if (m) return Number(m[1]) * 12 + (isEnd ? 11 : 0)
  return null
}

export interface DateRange {
  start: number
  end: number
  label: string
}

export function findDateRanges(text: string, now = new Date()): DateRange[] {
  const ranges: DateRange[] = []
  for (const match of text.matchAll(RANGE)) {
    const start = toMonth(match[1], now, false)
    const end = toMonth(match[2], now, true)
    const nowMonth = now.getFullYear() * 12 + now.getMonth()
    if (start === null || end === null || end < start || start > nowMonth) continue
    ranges.push({ start, end: Math.min(end, nowMonth), label: match[0] })
  }
  return ranges
}

/** Total years covered by the union of the ranges, rounded to one decimal. */
export function totalYears(ranges: DateRange[]): number {
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  let months = 0
  let curStart = -1
  let curEnd = -2
  for (const r of sorted) {
    if (r.start > curEnd + 1) {
      if (curEnd >= curStart && curStart >= 0) months += curEnd - curStart + 1
      curStart = r.start
      curEnd = r.end
    } else {
      curEnd = Math.max(curEnd, r.end)
    }
  }
  if (curStart >= 0) months += curEnd - curStart + 1
  return Math.round((months / 12) * 10) / 10
}

/** Experience estimate using only the work-experience section when present. */
export function estimateYears(experienceText: string, now = new Date()): number {
  return totalYears(findDateRanges(experienceText, now))
}
