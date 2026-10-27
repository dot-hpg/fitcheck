/// <reference lib="webworker" />
/**
 * Runs the embedding model off the main thread so the UI stays responsive
 * while the model downloads and while it embeds a few dozen sentences.
 */
import { env } from '@huggingface/transformers'
import ortMjs from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import ortWasm from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import type { Embedder } from '../engine/semantic'
import { loadEmbedder } from './embedder'

// Serve the ONNX runtime from our own origin instead of a CDN, so the only
// third-party request the app ever makes is the one-time model download.
env.backends.onnx.wasm!.wasmPaths = { mjs: ortMjs, wasm: ortWasm }

export type WorkerRequest = { id: number; texts: string[] }
export type WorkerResponse =
  | { type: 'progress'; fraction: number | null; loadedBytes: number }
  | { type: 'result'; id: number; vectors: number[][] }
  | { type: 'error'; id: number; message: string }

declare const self: DedicatedWorkerGlobalScope

let embedder: Promise<Embedder> | null = null
const post = (msg: WorkerResponse) => self.postMessage(msg)

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    embedder ??= loadEmbedder((p) => post({ type: 'progress', ...p }))
    const embed = await embedder
    post({ type: 'result', id: data.id, vectors: await embed(data.texts) })
  } catch (err) {
    // Let the next request retry, e.g. after the network comes back.
    embedder = null
    post({ type: 'error', id: data.id, message: err instanceof Error ? err.message : String(err) })
  }
}
