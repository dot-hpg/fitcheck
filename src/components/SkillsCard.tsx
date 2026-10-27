import type { Analysis, SkillMatch } from '../engine/analyze'
import { CheckIcon, XIcon } from './Icons'

function SkillChip({ m }: { m: SkillMatch }) {
  if (!m.inResume)
    return (
      <span className="chip chip-bad" title="Not found on your resume">
        <XIcon size={12} />
        {m.skill.name}
      </span>
    )
  if (m.listedOnly)
    return (
      <span className="chip chip-warn" title="Only in your skills list, not shown in experience or projects">
        <CheckIcon size={12} />
        {m.skill.name}
      </span>
    )
  return (
    <span className="chip chip-good" title="Found on your resume">
      <CheckIcon size={12} />
      {m.skill.name}
    </span>
  )
}

export function SkillsCard({ analysis }: { analysis: Analysis }) {
  const groups = [
    { label: 'Core skills', items: analysis.skills.filter((m) => m.importance === 'required') },
    { label: 'Nice to have', items: analysis.skills.filter((m) => m.importance === 'preferred') },
  ].filter((g) => g.items.length)

  return (
    <section className="card" aria-labelledby="skills-title">
      <div className="card-head">
        <div>
          <h2 id="skills-title">Skills the job asks for</h2>
          <p className="card-sub">Matched against ~100 skills and 350+ aliases (k8s, Postgres, Golang…).</p>
        </div>
      </div>
      {groups.length === 0 && <p className="empty">No specific technologies found in the job post.</p>}
      {groups.map((g) => (
        <div className="chip-group" key={g.label}>
          <p className="chip-label">{g.label}</p>
          <div className="chips">
            {g.items.map((m) => (
              <SkillChip key={m.skill.id} m={m} />
            ))}
          </div>
        </div>
      ))}
      {analysis.extraSkills.length > 0 && (
        <div className="chip-group">
          <p className="chip-label">Also on your resume</p>
          <div className="chips">
            {analysis.extraSkills.map((s) => (
              <span className="chip chip-neutral" key={s.id}>
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="legend">
        <span className="tone-good">
          <i className="dot" /> Shown in your work
        </span>
        <span className="tone-warn">
          <i className="dot" /> Only listed
        </span>
        <span className="tone-bad">
          <i className="dot" /> Missing
        </span>
      </div>
    </section>
  )
}

export function KeywordsCard({ analysis }: { analysis: Analysis }) {
  return (
    <section className="card" aria-labelledby="keywords-title">
      <div className="card-head">
        <div>
          <h2 id="keywords-title">Job language</h2>
          <p className="card-sub">The job post's most repeated domain words. Mirror them where they're true for you.</p>
        </div>
      </div>
      {analysis.keywords.length ? (
        <div className="chips">
          {analysis.keywords.map((k) => (
            <span key={k.term} className={`chip ${k.found ? 'chip-good' : 'chip-neutral'}`}>
              {k.found ? <CheckIcon size={12} /> : null}
              {k.term}
              {k.weight > 1 && <small>×{k.weight}</small>}
            </span>
          ))}
        </div>
      ) : (
        <p className="empty">Paste a longer job post to see its key language.</p>
      )}
    </section>
  )
}
