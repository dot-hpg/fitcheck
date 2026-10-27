/**
 * Semantic evidence matching: for each requirement in the job post, find the
 * resume line that means the most similar thing, even with different wording
 * ("built REST services" vs "designed backend APIs").
 *
 * The embedding model is injected so this module stays pure and testable; in
 * the app it is a sentence-transformer running on-device in a Web Worker.
 */

export type Embedder = (texts: string[]) => Promise<number[][]>

export type EvidenceLevel = 'strong' | 'partial' | 'gap'

export interface Evidence {
  requirement: string
  match: string | null
  similarity: number
  level: EvidenceLevel
}

export interface SemanticResult {
  evidence: Evidence[]
  /** 0..1 coverage of the job's requirements by the resume. */
  score: number
}

/** Calibrated for all-MiniLM-L6-v2, where unrelated sentences sit around 0.1 to 0.25. */
export const STRONG_AT = 0.55
export const PARTIAL_AT = 0.4

export function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

/** Rounded to the two decimals the UI shows, so a displayed 0.40 is never labelled a gap. */
export function levelFor(sim: number): EvidenceLevel {
  const shown = Math.round(sim * 100) / 100
  return shown >= STRONG_AT ? 'strong' : shown >= PARTIAL_AT ? 'partial' : 'gap'
}

/** Maps similarity onto 0..1 credit: nothing below 0.25, full credit from STRONG_AT. */
const credit = (sim: number) => Math.min(1, Math.max(0, (sim - 0.25) / (STRONG_AT - 0.25)))

export async function semanticEvidence(
  requirements: string[],
  resumeLines: string[],
  embed: Embedder,
): Promise<SemanticResult> {
  if (!requirements.length || !resumeLines.length) return { evidence: [], score: 0 }
  const vectors = await embed([...requirements, ...resumeLines])
  const reqVecs = vectors.slice(0, requirements.length)
  const lineVecs = vectors.slice(requirements.length)

  const evidence = requirements.map((requirement, i) => {
    let best = -1
    let similarity = -1
    lineVecs.forEach((v, j) => {
      const sim = cosine(reqVecs[i], v)
      if (sim > similarity) {
        similarity = sim
        best = j
      }
    })
    const level = levelFor(similarity)
    return { requirement, match: level === 'gap' ? null : resumeLines[best], similarity, level }
  })
  const score = evidence.reduce((sum, e) => sum + credit(e.similarity), 0) / evidence.length
  return { evidence, score }
}
