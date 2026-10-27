import { analyzeBullet, type BulletReport } from './bullets'
import { estimateYears } from './experience'
import { keywordCoverage, type Keyword } from './keywords'
import { parseJob, parseResume, type ParsedJob, type ParsedResume } from './parse'
import type { SemanticResult } from './semantic'
import { extractSkills, type Skill } from './skills'
import { countWords } from './text'

export type Importance = 'required' | 'preferred'

export interface SkillMatch {
  skill: Skill
  importance: Importance
  /** Times the job post mentions it; repeated skills matter more. */
  mentions: number
  inResume: boolean
  /** True when the resume names the skill only in a skills list, never in experience or projects. */
  listedOnly: boolean
}

export type ComponentKey = 'required' | 'preferred' | 'keywords' | 'semantic' | 'experience' | 'bullets'

export interface ScoreComponent {
  key: ComponentKey
  label: string
  /** 0..1, or null when the inputs give nothing to measure. Null components are left out of the total. */
  score: number | null
  weight: number
  detail: string
}

export type Verdict = 'Strong match' | 'Good match' | 'Fair match' | 'Low match'

export interface Analysis {
  score: number
  verdict: Verdict
  components: ScoreComponent[]
  skills: SkillMatch[]
  /** Skills on the resume that the job does not ask for. */
  extraSkills: Skill[]
  keywords: Keyword[]
  bullets: BulletReport[]
  years: { required: number | null; estimated: number }
  recommendations: string[]
  semantic: SemanticResult | null
}

export const WEIGHTS: Record<ComponentKey, number> = {
  required: 35,
  semantic: 20,
  keywords: 15,
  bullets: 12,
  experience: 10,
  preferred: 8,
}

export function verdictFor(score: number): Verdict {
  if (score >= 80) return 'Strong match'
  if (score >= 65) return 'Good match'
  if (score >= 45) return 'Fair match'
  return 'Low match'
}

const skillWeight = (m: SkillMatch) => 1 + Math.min(m.mentions - 1, 2) * 0.5

function skillScore(matches: SkillMatch[]): number | null {
  if (!matches.length) return null
  const total = matches.reduce((sum, m) => sum + skillWeight(m), 0)
  return matches.reduce((sum, m) => sum + (m.inResume ? skillWeight(m) : 0), 0) / total
}

export function matchSkills(job: ParsedJob, resume: ParsedResume): { skills: SkillMatch[]; extraSkills: Skill[] } {
  const relevant = job.lines.filter((l) => l.section !== 'info')
  const core = extractSkills(relevant.filter((l) => l.section !== 'preferred').map((l) => l.text).join('\n'))
  const preferred = extractSkills(relevant.filter((l) => l.section === 'preferred').map((l) => l.text).join('\n'))

  const resumeSkills = extractSkills(resume.text)
  const evidenceText = [...(resume.sections.experience ?? []), ...(resume.sections.projects ?? []), ...(resume.sections.summary ?? [])].join('\n')
  const evidenced = extractSkills(evidenceText)

  const build = (id: string, importance: Importance, mentions: number): SkillMatch => {
    const skill = (core.get(id) ?? preferred.get(id))!.skill
    const inResume = resumeSkills.has(id)
    return { skill, importance, mentions, inResume, listedOnly: inResume && !evidenced.has(id) }
  }
  const skills = [
    ...[...core.values()].map((h) => build(h.skill.id, 'required', h.count + (preferred.get(h.skill.id)?.count ?? 0))),
    ...[...preferred.values()].filter((h) => !core.has(h.skill.id)).map((h) => build(h.skill.id, 'preferred', h.count)),
  ].sort(
    (a, b) =>
      Number(a.importance === 'preferred') - Number(b.importance === 'preferred') ||
      b.mentions - a.mentions ||
      a.skill.name.localeCompare(b.skill.name),
  )

  const asked = new Set(skills.map((m) => m.skill.id))
  const extraSkills = [...resumeSkills.values()].filter((h) => !asked.has(h.skill.id)).map((h) => h.skill)
  return { skills, extraSkills }
}

/** Job lines worth checking for semantic evidence: must-have statements, not titles, perks or nice-to-haves. */
export function requirementLines(jobText: string): string[] {
  return parseJob(jobText)
    .lines.filter((l) => (l.section === 'required' || l.section === 'other') && countWords(l.text) >= 4 && countWords(l.text) <= 45)
    .map((l) => l.text)
    .slice(0, 24)
}

/** Resume lines that can count as evidence: bullets plus summary and skills lines. */
export function evidenceLines(resumeText: string): string[] {
  const resume = parseResume(resumeText)
  const extra = [...(resume.sections.summary ?? []), ...(resume.sections.skills ?? [])].filter((l) => countWords(l) >= 4)
  return [...new Set([...resume.bullets, ...extra])].slice(0, 80)
}

const list = (names: string[]) =>
  names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

export function analyze(jobText: string, resumeText: string, opts: { semantic?: SemanticResult | null; now?: Date } = {}): Analysis {
  const job = parseJob(jobText)
  const resume = parseResume(resumeText)
  const semantic = opts.semantic ?? null

  const { skills, extraSkills } = matchSkills(job, resume)
  const required = skills.filter((m) => m.importance === 'required')
  const preferred = skills.filter((m) => m.importance === 'preferred')

  const kw = keywordCoverage(
    job.lines.filter((l) => l.section !== 'info').map((l) => l.text).join('\n'),
    resume.text,
  )
  const bullets = resume.bullets.map(analyzeBullet)
  const bulletAvg = bullets.length ? bullets.reduce((s, b) => s + b.score, 0) / bullets.length / 100 : null

  const expText = (resume.sections.experience ?? []).join('\n') || resume.text
  const estimated = estimateYears(expText, opts.now)
  const expScore = job.minYears === null ? null : Math.min(1, estimated / job.minYears)

  const matched = (ms: SkillMatch[]) => ms.filter((m) => m.inResume).length
  const components: ScoreComponent[] = [
    {
      key: 'required',
      label: 'Core skills',
      score: skillScore(required),
      weight: WEIGHTS.required,
      detail: required.length ? `${matched(required)} of ${required.length} core skills found` : 'No specific skills detected in the job post',
    },
    {
      key: 'semantic',
      label: 'Requirement evidence (AI)',
      score: semantic ? semantic.score : null,
      weight: WEIGHTS.semantic,
      detail: semantic
        ? `${semantic.evidence.filter((e) => e.level !== 'gap').length} of ${semantic.evidence.length} requirements backed by a resume line`
        : 'Enable on-device AI to check meaning, not just words',
    },
    {
      key: 'keywords',
      label: 'Domain keywords',
      score: kw.score,
      weight: WEIGHTS.keywords,
      detail: `${kw.keywords.filter((k) => k.found).length} of ${kw.keywords.length} top keywords used`,
    },
    {
      key: 'bullets',
      label: 'Bullet impact',
      score: bulletAvg,
      weight: WEIGHTS.bullets,
      detail: bullets.length
        ? `${bullets.filter((b) => b.score >= 75).length} of ${bullets.length} bullets are strong`
        : 'No experience or project bullets found',
    },
    {
      key: 'experience',
      label: 'Experience',
      score: expScore,
      weight: WEIGHTS.experience,
      detail:
        job.minYears === null
          ? 'Job post does not state a minimum'
          : `~${estimated} yrs found vs ${job.minYears}+ asked`,
    },
    {
      key: 'preferred',
      label: 'Nice-to-haves',
      score: skillScore(preferred),
      weight: WEIGHTS.preferred,
      detail: preferred.length ? `${matched(preferred)} of ${preferred.length} bonus skills found` : 'No nice-to-have skills listed',
    },
  ]

  const active = components.filter((c) => c.score !== null)
  const weightSum = active.reduce((s, c) => s + c.weight, 0)
  const score = weightSum ? Math.round((active.reduce((s, c) => s + c.weight * c.score!, 0) / weightSum) * 100) : 0

  const recommendations: string[] = []
  const missingRequired = required.filter((m) => !m.inResume).map((m) => m.skill.name)
  if (missingRequired.length) {
    recommendations.push(
      `Missing core skills: ${list(missingRequired.slice(0, 6))}. If you have used them, name them in a bullet that shows what you built.`,
    )
  }
  const listedOnly = required.filter((m) => m.listedOnly).map((m) => m.skill.name)
  if (listedOnly.length) {
    recommendations.push(
      `${list(listedOnly.slice(0, 5))} ${listedOnly.length === 1 ? 'appears' : 'appear'} only in your skills list. Back ${listedOnly.length === 1 ? 'it' : 'them'} up with a project or experience bullet.`,
    )
  }
  if (job.minYears !== null && estimated < job.minYears) {
    recommendations.push(
      `The role asks for ${job.minYears}+ years and your dated experience adds up to about ${estimated}. Count internships and freelance work with dates, and lead with your strongest projects.`,
    )
  }
  const noMetric = bullets.filter((b) => b.issues.includes('no-metric')).length
  if (noMetric) {
    recommendations.push(
      `${noMetric} of ${bullets.length} bullets have no measurable result. Add numbers: latency, users, revenue, time saved or test coverage.`,
    )
  }
  const weakOpeners = bullets.filter((b) => b.issues.includes('weak-opener')).length
  if (weakOpeners) {
    recommendations.push(`${weakOpeners} bullets start passively ("Responsible for", "Worked on"). Lead with a strong verb instead.`)
  }
  const gaps = semantic?.evidence.filter((e) => e.level === 'gap') ?? []
  if (gaps.length) {
    recommendations.push(`No resume line clearly covers: "${gaps[0].requirement}"${gaps.length > 1 ? ` and ${gaps.length - 1} more` : ''}.`)
  }
  const missingKw = kw.keywords.filter((k) => !k.found).slice(0, 5).map((k) => k.term)
  if (missingKw.length) {
    recommendations.push(`Mirror the job's language where it's true for you: ${list(missingKw.map((k) => `"${k}"`))}.`)
  }

  return {
    score,
    verdict: verdictFor(score),
    components,
    skills,
    extraSkills,
    keywords: kw.keywords,
    bullets,
    years: { required: job.minYears, estimated },
    recommendations,
    semantic,
  }
}
