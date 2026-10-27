import { countWords, normalize } from './text'

/**
 * `intro` is the text before the first heading (title, team, location): its skills count, but it is not a
 * requirement statement. `info` covers company blurbs, benefits and logistics, which say nothing about fit.
 */
export type JdSection = 'required' | 'preferred' | 'other' | 'intro' | 'info'

export interface JdLine {
  text: string
  section: JdSection
}

export interface ParsedJob {
  lines: JdLine[]
  /** Minimum years of experience asked for, if the post states one. */
  minYears: number | null
}

const BULLET_PREFIX = /^\s*(?:[-*•▪●◦‣⁃∙·>]|\d{1,2}[.)])\s+/

const PREFERRED_HEADING = /\b(nice[\s-]to[\s-]have|preferred|bonus|good[\s-]to[\s-]have|desired|a plus|pluses|extra credit)\b/i
const REQUIRED_HEADING =
  /\b(requirements?|qualifications?|must[\s-]haves?|what you(?:'ll)? (?:need|bring)|who you are|about you|you have|you bring|skills|minimum|basic|tech stack|what we(?:'re)? looking for)\b/i
const OTHER_HEADING = /^(about the role|the role|role overview|overview|(key )?responsibilities|what you(?:'ll)? do|your impact|day to day|in this role)$/i
const INFO_HEADING =
  /^(about(?! (you|the role)\b)\b.*|who we are|our (mission|story|culture)|benefits|perks|why join us|what we offer|compensation|salary|location|equal opportunity.*|how to apply)$/i
const PREFERRED_INLINE = /\b(nice[\s-]to[\s-]have|preferred|is a plus|are a plus|a bonus|good[\s-]to[\s-]have|bonus points|ideally)\b/i

function isHeading(line: string): boolean {
  const words = countWords(line)
  if (words === 0 || words > 8 || BULLET_PREFIX.test(line)) return false
  if (/:\s*$/.test(line)) return true
  // ALL CAPS lines, or short Title Case lines without sentence punctuation.
  if (/[a-z]/i.test(line) && line === line.toUpperCase()) return true
  const bare = line.replace(/:\s*$/, '')
  if (OTHER_HEADING.test(bare) || INFO_HEADING.test(bare)) return true
  return words <= 5 && !/[.,;]$/.test(line) && (PREFERRED_HEADING.test(line) || REQUIRED_HEADING.test(line))
}

export function stripBullet(line: string): string {
  return line.replace(BULLET_PREFIX, '').trim()
}

/** Matches "3+ years", "3-5 years", "minimum of 2 years", "at least 4 yrs". */
const YEARS = /(\d{1,2})\s*(?:\+|plus)?\s*(?:(?:-|to)\s*\d{1,2}\s*)?\+?\s*(?:years?|yrs?)\b/gi

export function parseJob(raw: string): ParsedJob {
  const lines: JdLine[] = []
  let section: JdSection = 'intro'
  let sawHeading = false
  let minYears: number | null = null

  for (const rawLine of normalize(raw).split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    if (isHeading(line)) {
      sawHeading = true
      const bare = line.replace(/:\s*$/, '')
      section = INFO_HEADING.test(bare)
        ? 'info'
        : PREFERRED_HEADING.test(line)
          ? 'preferred'
          : REQUIRED_HEADING.test(line)
            ? 'required'
            : 'other'
      continue
    }
    const text = stripBullet(line)
    const lineSection: JdSection = section !== 'info' && section !== 'intro' && PREFERRED_INLINE.test(text) ? 'preferred' : section
    lines.push({ text, section: lineSection })

    if (lineSection === 'required' || lineSection === 'other' || lineSection === 'intro') {
      for (const m of text.matchAll(YEARS)) {
        // "experience" or "exp" nearby avoids picking up "5 years ago" style noise.
        const tail = text.slice(m.index, m.index + m[0].length + 40)
        if (!/\b(experience|exp|professional|industry|building|working|developing)\b/i.test(tail)) continue
        const n = Number(m[1])
        if (n > 0 && n <= 25) minYears = minYears === null ? n : Math.min(minYears, n)
      }
    }
  }
  // Without any headings the whole post is one block of requirements.
  if (!sawHeading) for (const l of lines) if (l.section === 'intro') l.section = 'other'
  return { lines, minYears }
}

export type ResumeSection = 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'other'

const RESUME_HEADINGS: [ResumeSection, RegExp][] = [
  ['experience', /^(work |professional |relevant )?(experience|employment|work history|internships?)$/i],
  ['projects', /^(personal |academic |key |selected )?projects?$/i],
  ['education', /^(education|academics?|academic background)$/i],
  ['skills', /^(technical |core |key )?(skills|competencies|technologies|tech stack|toolkit)$/i],
  ['summary', /^(summary|profile|about( me)?|objective|professional summary)$/i],
  ['other', /^(certifications?|achievements?|awards?|publications?|activities|leadership|interests|volunteering|languages)$/i],
]

export interface ParsedResume {
  sections: Partial<Record<ResumeSection, string[]>>
  /** Achievement statements from experience and projects. */
  bullets: string[]
  text: string
}

function resumeHeading(line: string): ResumeSection | null {
  const clean = line.replace(/[:\s|_=-]+$/g, '').replace(/^[\s|_=-]+/g, '').trim()
  if (countWords(clean) > 4) return null
  for (const [section, re] of RESUME_HEADINGS) if (re.test(clean)) return section
  return null
}

const looksLikeMeta = (line: string) =>
  // Date ranges, locations and job-title lines rarely end in a full sentence.
  /\b(19|20)\d{2}\b/.test(line) && countWords(line) < 12

export function parseResume(raw: string): ParsedResume {
  const text = normalize(raw)
  const sections: ParsedResume['sections'] = {}
  const bullets: string[] = []
  let current: ResumeSection = 'summary'
  let lastWasBullet = false

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = resumeHeading(line)
    if (heading) {
      current = heading
      lastWasBullet = false
      continue
    }
    ;(sections[current] ??= []).push(line)

    if (current !== 'experience' && current !== 'projects') continue
    const isBullet = BULLET_PREFIX.test(line)
    const body = stripBullet(line)
    if (!isBullet && lastWasBullet && /^[a-z(&]/.test(body)) {
      // A bullet that wrapped onto the next line, common in PDF text extraction.
      bullets[bullets.length - 1] += ' ' + body
      continue
    }
    lastWasBullet = false
    if (isBullet ? countWords(body) >= 3 : countWords(body) >= 8 && !looksLikeMeta(body)) {
      bullets.push(body)
      lastWasBullet = true
    }
  }
  return { sections, bullets, text }
}
