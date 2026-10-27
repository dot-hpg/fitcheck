export type Tone = 'good' | 'warn' | 'bad'

/** Colour band for a 0..1 score, shared by every bar and badge. */
export const toneFor = (score: number): Tone => (score >= 0.75 ? 'good' : score >= 0.5 ? 'warn' : 'bad')
