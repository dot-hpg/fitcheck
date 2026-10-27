import { pipeline } from '@huggingface/transformers'
import type { Embedder } from '../engine/semantic'

/** A 6-layer sentence-transformer: ~23 MB quantised, fast enough for CPU/WASM in the browser. */
export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'

export interface LoadProgress {
  /** 0..1 across all model files, or null while sizes are still unknown. */
  fraction: number | null
  loadedBytes: number
}

interface ProgressEvent {
  status: string
  file?: string
  loaded?: number
  total?: number
}

/** Loads the model once and returns a function that embeds sentences into unit vectors. */
export async function loadEmbedder(
  onProgress?: (p: LoadProgress) => void,
  dtype: 'q8' | 'fp32' = 'q8',
): Promise<Embedder> {
  const files = new Map<string, { loaded: number; total: number }>()
  const extractor = await pipeline('feature-extraction', MODEL_ID, {
    dtype,
    progress_callback: (event: ProgressEvent) => {
      if (event.status !== 'progress' || !event.file || !onProgress) return
      files.set(event.file, { loaded: event.loaded ?? 0, total: event.total ?? 0 })
      let loaded = 0
      let total = 0
      for (const f of files.values()) {
        loaded += f.loaded
        total += f.total
      }
      onProgress({ fraction: total ? loaded / total : null, loadedBytes: loaded })
    },
  })
  return async (texts) => {
    const output = await extractor(texts, { pooling: 'mean', normalize: true })
    return output.tolist() as number[][]
  }
}
