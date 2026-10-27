import type { Evidence } from '../engine/semantic'
import type { LoadProgress } from '../semantic/embedder'
import { SparkIcon } from './Icons'

export type AiState =
  | { status: 'idle' }
  | { status: 'loading'; progress: LoadProgress | null }
  | { status: 'ready'; evidence: Evidence[] }
  | { status: 'stale' }
  | { status: 'error'; message: string }

const LEVEL_LABEL = { strong: 'Strong', partial: 'Partial', gap: 'Gap' }

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

export function EvidenceCard({ state, onRun }: { state: AiState; onRun: () => void }) {
  return (
    <section className="card" aria-labelledby="ai-title">
      <div className="card-head">
        <div>
          <h2 id="ai-title">
            <SparkIcon size={16} /> Requirement evidence
          </h2>
          <p className="card-sub">
            An AI model running on your device reads each requirement and finds the resume line that means the same
            thing, even in different words.
          </p>
        </div>
        {state.status === 'ready' && (
          <button type="button" className="btn btn-small" onClick={onRun}>
            Re-run
          </button>
        )}
      </div>

      {(state.status === 'idle' || state.status === 'stale' || state.status === 'error') && (
        <div className="ai-cta">
          <p>
            {state.status === 'stale'
              ? 'Your text changed since the last AI check.'
              : 'Downloads a small sentence-embedding model (about 23 MB) once. Your browser caches it, and your resume never leaves this device.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={onRun}>
            <SparkIcon size={16} />
            {state.status === 'idle' ? 'Run AI check' : 'Run again'}
          </button>
        </div>
      )}
      {state.status === 'error' && (
        <p className="error" role="alert">
          The AI model could not load: {state.message}. The rest of your analysis still works offline.
        </p>
      )}

      {state.status === 'loading' && (
        <div className="progress" role="status">
          <div className="bar">
            <span style={{ width: `${(state.progress?.fraction ?? 0.05) * 100}%` }} />
          </div>
          <p className="progress-label">
            {state.progress?.fraction != null && state.progress.fraction < 1
              ? `Downloading model… ${mb(state.progress.loadedBytes)}`
              : 'Reading your resume…'}
          </p>
        </div>
      )}

      {state.status === 'ready' && (
        <ul className="evidence" data-testid="evidence">
          {state.evidence.map((e) => (
            <li key={e.requirement}>
              <div>
                <span className="evidence-label">Job needs</span>
                {e.requirement}
              </div>
              <div>
                <span className="evidence-label">Your best match</span>
                {e.match ?? <em className="tone-bad">No clear match on your resume</em>}
              </div>
              <div className="evidence-score">
                <span className={`badge badge-${e.level}`}>{LEVEL_LABEL[e.level]}</span>
                <div className={`bar tone-${e.level === 'strong' ? 'good' : e.level === 'partial' ? 'warn' : 'bad'}`}>
                  <span style={{ width: `${Math.max(0, Math.min(1, e.similarity)) * 100}%` }} />
                </div>
                <span>{e.similarity.toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
