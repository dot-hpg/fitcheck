// @vitest-environment node
/**
 * Smoke test against the real model. It needs the model files on disk, so it
 * only runs when FITCHECK_MODEL_DIR points at a folder containing
 * Xenova/all-MiniLM-L6-v2 (see CONTRIBUTING in the README).
 */
import { env } from '@huggingface/transformers'
import { describe, expect, it } from 'vitest'
import { evidenceLines, requirementLines } from '../engine/analyze'
import { cosine, semanticEvidence } from '../engine/semantic'
import { SAMPLE_JOB, SAMPLE_RESUME } from '../samples'
import { loadEmbedder } from './embedder'

const modelDir = process.env.FITCHECK_MODEL_DIR

describe.skipIf(!modelDir)('embedder with the real model', () => {
  it('ranks paraphrases far above unrelated sentences and finds evidence', async () => {
    env.localModelPath = modelDir!
    env.allowRemoteModels = false
    const embed = await loadEmbedder(undefined, 'fp32')

    const [cat, api, apiParaphrase] = await embed([
      'The cat sat on the mat',
      'Designed RESTful APIs backed by PostgreSQL',
      'Experience designing REST APIs with Postgres',
    ])
    expect(cosine(api, apiParaphrase)).toBeGreaterThan(0.7)
    expect(cosine(api, cat)).toBeLessThan(0.2)

    const result = await semanticEvidence(requirementLines(SAMPLE_JOB), evidenceLines(SAMPLE_RESUME), embed)
    const restReq = result.evidence.find((e) => e.requirement.startsWith('Experience designing RESTful APIs'))
    expect(restReq?.level).toBe('strong')
    expect(restReq?.match).toMatch(/^Designed RESTful APIs/)
  }, 120_000)
})
