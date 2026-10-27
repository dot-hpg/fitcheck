import { SKILLS } from './skills'
import { contentTokens, stem } from './text'

export interface Keyword {
  /** The most common surface form in the job post, e.g. "payments". */
  term: string
  /** How often the stem appears in the job post (capped). */
  weight: number
  found: boolean
}

/** Tokens that belong to skill names. Skills are scored separately, so skip them here. */
const SKILL_TOKENS = new Set(
  SKILLS.flatMap((s) => [...s.aliases, ...(s.exact ?? []).map((e) => e.toLowerCase())]).flatMap((a) =>
    a.split(/\s+/).map(stem),
  ),
)

export function topKeywords(jobText: string, limit = 20): Map<string, { term: string; weight: number }> {
  // Words that only ever appear capitalised ("Northwind", "Bengaluru") are names, not skills to mirror.
  const lowercaseUses = new Set(jobText.match(/(?<![A-Za-z])[a-z][a-z0-9+#-]*/g) ?? [])
  const counts = new Map<string, { forms: Map<string, number>; count: number }>()
  for (const token of contentTokens(jobText)) {
    if (/\d/.test(token) || !lowercaseUses.has(token)) continue
    const key = stem(token)
    if (SKILL_TOKENS.has(key) || key.length < 3) continue
    const entry = counts.get(key) ?? { forms: new Map(), count: 0 }
    entry.count++
    entry.forms.set(token, (entry.forms.get(token) ?? 0) + 1)
    counts.set(key, entry)
  }
  const ranked = [...counts.entries()]
    .map(([key, { forms, count }]) => {
      const term = [...forms.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
      return { key, term, weight: Math.min(count, 4) }
    })
    .sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term))
    .slice(0, limit)
  return new Map(ranked.map(({ key, term, weight }) => [key, { term, weight }]))
}

/** Weighted share of the job post's top domain keywords that the resume also uses. */
export function keywordCoverage(jobText: string, resumeText: string, limit = 20) {
  const top = topKeywords(jobText, limit)
  const resumeStems = new Set(contentTokens(resumeText).map(stem))
  const keywords: Keyword[] = [...top.entries()].map(([key, { term, weight }]) => ({
    term,
    weight,
    found: resumeStems.has(key),
  }))
  const total = keywords.reduce((sum, k) => sum + k.weight, 0)
  const hit = keywords.reduce((sum, k) => sum + (k.found ? k.weight : 0), 0)
  return { keywords, score: total ? hit / total : null }
}
