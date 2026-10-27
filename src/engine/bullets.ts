import { countWords } from './text'

/** Verbs that signal ownership and impact at the start of a resume bullet. */
export const STRONG_VERBS = new Set(
  `accelerated achieved architected automated boosted built championed consolidated created cut debugged decreased
  delivered deployed designed developed devised doubled drove eliminated enabled engineered established expanded
  extended founded generated grew halved implemented improved increased initiated integrated introduced launched
  led leveraged maintained managed mentored migrated modernized monitored negotiated optimized orchestrated
  overhauled owned partnered pioneered prototyped published rebuilt redesigned reduced refactored resolved
  revamped saved scaled secured shipped simplified spearheaded standardized streamlined strengthened tested
  trained transformed tripled troubleshot unified upgraded wrote analyzed authored coordinated configured
  containerized converted crafted defined evaluated facilitated identified instrumented investigated modeled
  ported productionized ran restructured shortened sped trimmed won`.split(/\s+/),
)

const WEAK_OPENERS = [
  /^responsible for\s+/i,
  /^(?:was |were )?(?:involved|participated|engaged) in\s+/i,
  /^worked (?:on|with|in)\s+/i,
  /^helped(?: (?:to|with|in))?\s+/i,
  /^assisted(?: (?:in|with))?\s+/i,
  /^tasked with\s+/i,
  /^duties included\s+/i,
  /^handled\s+/i,
  /^(?:was |were )?part of\s+/i,
  /^contributed to\s+/i,
  /^did\s+/i,
]

const PRONOUN = /^(i|we|my|our)\b/i
const METRIC =
  /(\d|%|\$|₹|€|£|\b(?:doubled|tripled|halved|tenfold|twofold|tens of|hundreds of|thousands of|millions of|billions of)\b)/i

export type BulletIssue = 'weak-opener' | 'no-action-verb' | 'no-metric' | 'too-short' | 'too-long' | 'first-person'

export const ISSUE_LABEL: Record<BulletIssue, string> = {
  'weak-opener': 'Passive opener',
  'no-action-verb': 'No action verb',
  'no-metric': 'No measurable result',
  'too-short': 'Too vague',
  'too-long': 'Too long',
  'first-person': 'First-person pronoun',
}

const PENALTY: Record<BulletIssue, number> = {
  'weak-opener': 30,
  'no-action-verb': 15,
  'no-metric': 25,
  'too-short': 15,
  'too-long': 10,
  'first-person': 10,
}

export interface BulletReport {
  text: string
  score: number
  issues: BulletIssue[]
  /** A suggested rewrite with [placeholders] for facts only the author knows. */
  suggestion: string | null
}

/** Pick a verb that fits what the bullet is about, so suggestions read naturally. */
export function suggestVerb(text: string): string {
  const t = text.toLowerCase()
  const rules: [RegExp, string][] = [
    [/\b(test|tests|testing|qa|coverage)\b/, 'Automated'],
    [/\b(mentor|mentoring|team|interns?|onboard)/, 'Led'],
    [/\b(migrat|upgrade|port)/, 'Migrated'],
    [/\b(performance|latency|speed|slow|optimi[sz]|query|queries)/, 'Optimized'],
    [/\b(bug|bugs|issue|issues|incident|outage|fix)/, 'Resolved'],
    [/\b(deploy|pipeline|ci\/cd|infrastructure|docker|kubernetes)/, 'Automated'],
    [/\b(api|apis|service|services|backend|microservice|endpoint)/, 'Engineered'],
    [/\b(ui|frontend|dashboard|page|component|interface)/, 'Built'],
    [/\b(data|report|analysis|analytics|insight)/, 'Analyzed'],
    [/\b(design|architect)/, 'Designed'],
  ]
  for (const [re, verb] of rules) if (re.test(t)) return verb
  return 'Built'
}

const IRREGULAR_BASE: Record<string, string> = {
  built: 'build', led: 'lead', wrote: 'write', ran: 'run', drove: 'drive', grew: 'grow', won: 'win', cut: 'cut',
  sped: 'speed', made: 'make', set: 'set', troubleshot: 'troubleshoot',
}

/** Base forms of the strong verbs ("improve", "build"), used to spot "helped improve ...". */
const BASE_VERBS = new Set<string>([
  ...Object.values(IRREGULAR_BASE),
  ...[...STRONG_VERBS].flatMap((v) => (v.endsWith('ed') ? [v.slice(0, -1), v.slice(0, -2)] : [])),
  ...'support fix handle maintain do work make create write test manage update add'.split(' '),
])

const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s)
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "building the API" -> "the API", "improve speed" -> "speed": the new verb replaces it. */
function dropLeadingVerb(s: string): string {
  const first = (s.match(/^[A-Za-z]+/)?.[0] ?? '').toLowerCase()
  const isVerb = (first.endsWith('ing') && first.length > 5) || BASE_VERBS.has(first)
  return isVerb ? s.slice(first.length).trimStart() : s
}

const LEADING_PRONOUN = /^(?:i|we)\s+/i

export function analyzeBullet(text: string): BulletReport {
  const issues: BulletIssue[] = []
  const words = countWords(text)
  const core = text.replace(LEADING_PRONOUN, '')
  const firstWord = (core.match(/^[A-Za-z]+/)?.[0] ?? '').toLowerCase()

  const weak = WEAK_OPENERS.find((re) => re.test(core))
  if (PRONOUN.test(text)) issues.push('first-person')
  if (weak) issues.push('weak-opener')
  else if (!STRONG_VERBS.has(firstWord) && !(firstWord.endsWith('ed') && firstWord.length > 4)) issues.push('no-action-verb')
  if (!METRIC.test(text)) issues.push('no-metric')
  if (words < 8) issues.push('too-short')
  if (words > 40) issues.push('too-long')

  const score = Math.max(0, 100 - issues.reduce((sum, i) => sum + PENALTY[i], 0))

  let suggestion: string | null = null
  if (issues.length) {
    let body = core
    if (weak) body = `${suggestVerb(text)} ${lowerFirst(dropLeadingVerb(core.replace(weak, '')))}`
    else if (issues.includes('no-action-verb')) body = `${suggestVerb(text)} ${lowerFirst(core)}`
    body = upperFirst(body).replace(/[.;\s]+$/, '')
    if (issues.includes('no-metric')) body += ', [improving <metric> by <X%> / serving <N> users]'
    suggestion = body + '.'
  }
  return { text, score, issues, suggestion }
}
