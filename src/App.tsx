import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { BulletCoach } from './components/BulletCoach'
import { EvidenceCard, type AiState } from './components/EvidenceCard'
import { Fixes } from './components/Fixes'
import { DownloadIcon, GitHubIcon, LockIcon, SparkIcon, SunMoonIcon } from './components/Icons'
import { InputCard } from './components/InputCard'
import { ScoreOverview } from './components/ScoreOverview'
import { KeywordsCard, SkillsCard } from './components/SkillsCard'
import { analyze, evidenceLines, requirementLines } from './engine/analyze'
import { toMarkdown } from './engine/report'
import { semanticEvidence, type Embedder, type SemanticResult } from './engine/semantic'
import { useStoredState } from './hooks/useStoredState'
import { useTheme } from './hooks/useTheme'
import { SAMPLE_JOB, SAMPLE_RESUME } from './samples'

const REPO_URL = 'https://github.com/dot-hpg/fitcheck'

type AiRun = { status: 'done'; inputs: string; result: SemanticResult } | Exclude<AiState, { status: 'ready' | 'stale' }>

async function readResumeFile(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('That file is over 10 MB. Try exporting a smaller PDF.')
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return file.text()
  // pdf.js is ~400 KB, so it only loads when someone actually uploads a PDF.
  const { extractPdfText } = await import('./pdf/extract')
  const text = await extractPdfText(file)
  if (!text.trim()) throw new Error('No text found in that PDF. It may be a scanned image; paste the text instead.')
  return text
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const { theme, cycle } = useTheme()
  const [job, setJob] = useStoredState('fitcheck:job', '')
  const [resume, setResume] = useStoredState('fitcheck:resume', '')
  const [started, setStarted] = useState(false)
  const [ai, setAi] = useState<AiRun>({ status: 'idle' })
  const embedder = useRef<Embedder | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Analysis is synchronous and fast; deferring keeps typing smooth on long resumes.
  const deferredJob = useDeferredValue(job)
  const deferredResume = useDeferredValue(resume)
  const inputsKey = `${deferredJob}\u0000${deferredResume}`
  const semantic = ai.status === 'done' && ai.inputs === inputsKey ? ai.result : null
  const analysis = useMemo(
    () => (started ? analyze(deferredJob, deferredResume, { semantic }) : null),
    [started, deferredJob, deferredResume, semantic],
  )

  const aiState: AiState =
    ai.status === 'done' ? (semantic ? { status: 'ready', evidence: semantic.evidence } : { status: 'stale' }) : ai

  const canAnalyze = job.trim().length > 0 && resume.trim().length > 0

  const start = () => {
    setStarted(true)
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const runAi = async () => {
    const inputs = inputsKey
    setAi({ status: 'loading', progress: null })
    try {
      if (!embedder.current) {
        const { createWorkerEmbedder } = await import('./semantic/client')
        embedder.current = createWorkerEmbedder((progress) =>
          setAi((s) => (s.status === 'loading' ? { status: 'loading', progress } : s)),
        )
      }
      const result = await semanticEvidence(requirementLines(deferredJob), evidenceLines(deferredResume), embedder.current)
      setAi({ status: 'done', inputs, result })
    } catch (err) {
      setAi({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="./">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
          FitCheck
        </a>
        <div className="topbar-actions">
          <button type="button" className="btn btn-small btn-ghost" onClick={cycle} aria-label={`Theme: ${theme}. Click to change.`}>
            <SunMoonIcon size={15} />
            <span className="btn-label">{theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}</span>
          </button>
          <a className="btn btn-small" href={REPO_URL} target="_blank" rel="noreferrer">
            <GitHubIcon size={15} />
            <span className="btn-label">Source</span>
          </a>
        </div>
      </header>

      <main>
        <div className="hero">
          <h1>
            Will your resume pass for <em>this</em> job?
          </h1>
          <p>
            Paste a job post and your resume. FitCheck explains your match score, shows which skills are missing, and
            rewrites weak bullet points, all inside your browser.
          </p>
          <div className="pill-row">
            <span className="pill">
              <LockIcon size={13} /> Nothing is uploaded
            </span>
            <span className="pill">
              <SparkIcon size={13} /> On-device AI
            </span>
            <span className="pill">Free, no sign-up</span>
          </div>
        </div>

        <div className="inputs">
          <InputCard
            id="job"
            step={1}
            title="Job description"
            hint="Paste the full post, including requirements."
            value={job}
            onChange={setJob}
            placeholder={'Software Engineer, Backend\n\nRequirements\n- 2+ years building APIs in Java or Go\n- PostgreSQL, Redis, Docker…'}
          />
          <InputCard
            id="resume"
            step={2}
            title="Your resume"
            hint="Upload a PDF or paste the text."
            value={resume}
            onChange={setResume}
            onFile={async (file) => setResume(await readResumeFile(file))}
            placeholder={'EXPERIENCE\nSoftware Engineer, Acme · Jan 2023 - Present\n• Built…\n\nSKILLS\nJava, Go, PostgreSQL…'}
          />
        </div>

        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={start} disabled={!canAnalyze}>
            Check my fit
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setJob(SAMPLE_JOB)
              setResume(SAMPLE_RESUME)
              start()
            }}
          >
            Try a sample
          </button>
          {(job || resume) && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setJob('')
                setResume('')
                setStarted(false)
                setAi({ status: 'idle' })
              }}
            >
              Clear
            </button>
          )}
          <span className="privacy-note">
            <LockIcon size={13} /> Your text stays on this device.
          </span>
        </div>

        <div ref={resultsRef} className="results">
          {analysis && (
            <>
              <div className="card-head" style={{ marginBottom: 0 }}>
                <h2 className="results-title">Your results</h2>
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => download('fitcheck-report.md', toMarkdown(analysis))}
                >
                  <DownloadIcon size={14} /> Download report
                </button>
              </div>
              <ScoreOverview analysis={analysis} />
              <Fixes items={analysis.recommendations} />
              <div className="grid-2">
                <SkillsCard analysis={analysis} />
                <KeywordsCard analysis={analysis} />
              </div>
              <EvidenceCard state={aiState} onRun={() => void runAi()} />
              <BulletCoach bullets={analysis.bullets} />
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <span>FitCheck runs entirely in your browser. No accounts, no tracking, no servers.</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          Open source on GitHub
        </a>
      </footer>
    </div>
  )
}
