import type { Embedder } from '../engine/semantic'
import type { LoadProgress } from './embedder'
import type { WorkerRequest, WorkerResponse } from './worker'

/** Give up when the worker has been silent this long; a stalled download should not spin forever. */
const STALL_MS = 60_000

/**
 * An Embedder backed by the model in a Web Worker. Requests are matched to
 * responses by id, so concurrent calls are safe.
 */
export function createWorkerEmbedder(onProgress: (p: LoadProgress) => void): Embedder {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<number, { resolve: (v: number[][]) => void; reject: (e: Error) => void }>()
  let nextId = 0
  let watchdog: ReturnType<typeof setTimeout> | undefined

  const failAll = (message: string) => {
    for (const { reject } of pending.values()) reject(new Error(message))
    pending.clear()
  }
  const kick = () => {
    clearTimeout(watchdog)
    if (pending.size) watchdog = setTimeout(() => failAll('the download stalled. Check your connection and try again'), STALL_MS)
  }

  worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
    kick()
    if (data.type === 'progress') return onProgress(data)
    const request = pending.get(data.id)
    if (!request) return
    pending.delete(data.id)
    if (data.type === 'result') request.resolve(data.vectors)
    else request.reject(new Error(data.message))
    kick()
  }
  worker.onerror = (event) => failAll(event.message || 'the AI worker crashed')

  return (texts) =>
    new Promise((resolve, reject) => {
      const id = nextId++
      pending.set(id, { resolve, reject })
      kick()
      worker.postMessage({ id, texts } satisfies WorkerRequest)
    })
}
