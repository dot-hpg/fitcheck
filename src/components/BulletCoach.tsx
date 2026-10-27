import { useState } from 'react'
import { ISSUE_LABEL, type BulletReport } from '../engine/bullets'
import { CopyIcon } from './Icons'
import { toneFor } from './tone'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-small btn-ghost"
      aria-label="Copy suggestion"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      <CopyIcon size={14} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function BulletCoach({ bullets }: { bullets: BulletReport[] }) {
  const [showAll, setShowAll] = useState(false)
  const weak = bullets.filter((b) => b.issues.length)
  const shown = showAll ? bullets : weak

  return (
    <section className="card" aria-labelledby="bullets-title">
      <div className="card-head">
        <div>
          <h2 id="bullets-title">Bullet coach</h2>
          <p className="card-sub">
            Recruiters skim. Strong bullets start with an action verb and end with a measurable result.
          </p>
        </div>
        {bullets.length > 0 && (
          <div className="toggle-row" role="group" aria-label="Which bullets to show">
            <button type="button" className={`btn btn-small${showAll ? ' btn-ghost' : ''}`} onClick={() => setShowAll(false)} aria-pressed={!showAll}>
              Needs work ({weak.length})
            </button>
            <button type="button" className={`btn btn-small${showAll ? '' : ' btn-ghost'}`} onClick={() => setShowAll(true)} aria-pressed={showAll}>
              All ({bullets.length})
            </button>
          </div>
        )}
      </div>
      {bullets.length === 0 && (
        <p className="empty">No bullet points found under Experience or Projects. Use headings and • bullets so FitCheck can find them.</p>
      )}
      {bullets.length > 0 && shown.length === 0 && <p className="empty">Every bullet is strong. Great job.</p>}
      <ul className="bullets">
        {shown.map((b) => {
          const tone = toneFor(b.score / 100)
          return (
            <li className="bullet" key={b.text}>
              <div className="bullet-top">
                <span className={`bullet-score chip-${tone}`}>{b.score}</span>
                <p className="bullet-text">{b.text}</p>
              </div>
              {b.issues.length > 0 && (
                <div className="issues">
                  {b.issues.map((i) => (
                    <span key={i} className="chip chip-neutral">
                      {ISSUE_LABEL[i]}
                    </span>
                  ))}
                </div>
              )}
              {b.suggestion && (
                <div className="suggestion">
                  <p>
                    <strong>Try: </strong>
                    {b.suggestion}
                  </p>
                  <CopyButton text={b.suggestion} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
