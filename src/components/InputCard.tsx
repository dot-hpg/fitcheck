import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { countWords } from '../engine/text'
import { UploadIcon } from './Icons'

interface Props {
  id: string
  step: number
  title: string
  hint: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  /** When set, the card accepts PDF/TXT uploads and drops. */
  onFile?: (file: File) => Promise<void>
  extra?: ReactNode
}

export function InputCard({ id, step, title, hint, value, placeholder, onChange, onFile, extra }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async (file: File | undefined) => {
    if (!file || !onFile) return
    setError(null)
    setBusy(true)
    try {
      await onFile(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      setBusy(false)
    }
  }

  const dropProps = onFile
    ? {
        onDragOver: (e: DragEvent) => {
          e.preventDefault()
          setDragging(true)
        },
        onDragLeave: () => setDragging(false),
        onDrop: (e: DragEvent) => {
          e.preventDefault()
          setDragging(false)
          void load(e.dataTransfer.files[0])
        },
      }
    : {}

  return (
    <section className="card" aria-labelledby={`${id}-title`}>
      <div className="card-head">
        <div>
          <h2 id={`${id}-title`}>
            <span className="step">{step}</span>
            {title}
          </h2>
          <p className="card-sub">{hint}</p>
        </div>
        {onFile && (
          <>
            <button type="button" className="btn btn-small" onClick={() => fileInput.current?.click()} disabled={busy}>
              <UploadIcon size={14} />
              {busy ? 'Reading…' : 'Upload PDF'}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              hidden
              data-testid={`${id}-file`}
              onChange={(e) => {
                void load(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </>
        )}
      </div>
      <div className={`dropzone${dragging ? ' dragging' : ''}`} {...dropProps}>
        <label htmlFor={id} className="sr-only">
          {title}
        </label>
        <textarea id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
        {dragging && <div className="drop-hint">Drop your resume here</div>}
      </div>
      <div className="input-meta">
        <span>{countWords(value)} words</span>
        {extra}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
