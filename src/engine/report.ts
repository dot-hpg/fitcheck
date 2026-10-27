import type { Analysis } from './analyze'
import { ISSUE_LABEL } from './bullets'

const pct = (n: number | null) => (n === null ? 'n/a' : `${Math.round(n * 100)}%`)

/** A Markdown report the user can save next to their application. */
export function toMarkdown(a: Analysis, generatedAt = new Date()): string {
  const out: string[] = []
  out.push(`# FitCheck report: ${a.score}/100 (${a.verdict})`, '')
  out.push(`_Generated ${generatedAt.toISOString().slice(0, 10)} with FitCheck. Everything ran locally in the browser._`, '')

  out.push('## Score breakdown', '', '| Component | Score | Weight | Detail |', '| --- | --- | --- | --- |')
  for (const c of a.components) out.push(`| ${c.label} | ${pct(c.score)} | ${c.score === null ? '-' : c.weight} | ${c.detail} |`)
  out.push('')

  if (a.recommendations.length) {
    out.push('## Top fixes', '')
    a.recommendations.forEach((r, i) => out.push(`${i + 1}. ${r}`))
    out.push('')
  }

  if (a.skills.length) {
    out.push('## Skills', '')
    for (const importance of ['required', 'preferred'] as const) {
      const ms = a.skills.filter((m) => m.importance === importance)
      if (!ms.length) continue
      out.push(`**${importance === 'required' ? 'Core' : 'Nice to have'}:** ` + ms.map((m) => `${m.inResume ? '✅' : '❌'} ${m.skill.name}`).join(' · '))
      out.push('')
    }
  }

  if (a.semantic?.evidence.length) {
    out.push('## Requirement evidence', '', '| Requirement | Best resume line | Similarity |', '| --- | --- | --- |')
    for (const e of a.semantic.evidence) {
      out.push(`| ${e.requirement.replace(/\|/g, '/')} | ${e.match?.replace(/\|/g, '/') ?? '_no clear match_'} | ${e.similarity.toFixed(2)} |`)
    }
    out.push('')
  }

  const weak = a.bullets.filter((b) => b.suggestion)
  if (weak.length) {
    out.push('## Bullet rewrites', '')
    for (const b of weak) {
      out.push(`- **Before:** ${b.text}`, `  - Issues: ${b.issues.map((i) => ISSUE_LABEL[i]).join(', ')}`, `  - **Try:** ${b.suggestion}`)
    }
    out.push('')
  }
  return out.join('\n')
}
