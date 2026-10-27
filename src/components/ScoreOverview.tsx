import type { Analysis } from '../engine/analyze'
import { toneFor, type Tone } from './tone'

const R = 70
const CIRCUMFERENCE = 2 * Math.PI * R

/** The ring colour follows the verdict, so "Good match" never shows in a warning colour. */
const VERDICT_TONE: Record<Analysis['verdict'], Tone> = {
  'Strong match': 'good',
  'Good match': 'good',
  'Fair match': 'warn',
  'Low match': 'bad',
}

function Gauge({ score, tone }: { score: number; tone: Tone }) {
  return (
    <svg viewBox="0 0 180 180" role="img" aria-label={`Match score ${score} out of 100`}>
      <circle className="gauge-track" cx="90" cy="90" r={R} fill="none" strokeWidth="14" />
      <circle
        className={`gauge-value tone-${tone}`}
        cx="90"
        cy="90"
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
        transform="rotate(-90 90 90)"
      />
      <text className="gauge-number" x="90" y="98" textAnchor="middle" data-testid="score">
        {score}
      </text>
      <text className="gauge-of" x="90" y="122" textAnchor="middle">
        out of 100
      </text>
    </svg>
  )
}

const SUMMARY: Record<Analysis['verdict'], string> = {
  'Strong match': 'Apply with confidence. Polish the few gaps below.',
  'Good match': 'Worth applying. A few targeted edits will lift this further.',
  'Fair match': 'Some overlap. Tailor your resume before applying.',
  'Low match': 'Big gaps for this role. Tailor heavily or look for a closer fit.',
}

export function ScoreOverview({ analysis }: { analysis: Analysis }) {
  const tone = VERDICT_TONE[analysis.verdict]
  return (
    <section className="card overview" aria-labelledby="overview-title" aria-live="polite">
      <div className="gauge">
        <Gauge score={analysis.score} tone={tone} />
        <div id="overview-title" className={`verdict tone-${tone}`}>
          {analysis.verdict}
        </div>
        <p className="card-sub">{SUMMARY[analysis.verdict]}</p>
      </div>
      <div>
        <h2 style={{ marginBottom: 14 }}>How the score is built</h2>
        <ul className="breakdown">
          {analysis.components.map((c) => (
            <li key={c.key} className={c.score === null ? 'muted-row' : ''} data-testid={`component-${c.key}`}>
              <div className="breakdown-row">
                <strong>{c.label}</strong>
                <span>{c.score === null ? 'n/a' : `${Math.round(c.score * 100)}%`}</span>
              </div>
              <div className={`bar tone-${c.score === null ? 'bad' : toneFor(c.score)}`}>
                <span style={{ width: `${(c.score ?? 0) * 100}%` }} />
              </div>
              <span className="breakdown-detail">
                {c.detail}
                {c.score !== null && ` · weight ${c.weight}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
