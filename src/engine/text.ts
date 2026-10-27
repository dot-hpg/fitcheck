/** Text normalisation, tokenisation and light stemming. */

export const STOPWORDS = new Set(
  `a about above across after again against all also am an and any are as at be because been before being
  below between both but by can could did do does doing down during each either etc few for from further had
  has have having he her here hers him his how i if in into is it its itself just less like may me might more
  most must my no nor not now of off on once only or other our ours out over own per same shall she should so
  some such than that the their theirs them then there these they this those through to too under until up upon
  us very via was we well were what when where which while who whom why will with within without would yet you
  your yours e.g i.e`.split(/\s+/),
)

/**
 * Words that appear in almost every job post or resume and say nothing about
 * fit. Excluding them keeps the keyword list focused on the actual domain.
 */
export const GENERIC_WORDS = new Set(
  `ability able across applicant apply candidate candidates company day degree environment equal excellent
  experience experienced familiar familiarity field good great help ideal including job join knowledge looking
  new opportunity plus preferred proficiency proficient qualification qualifications required requirement
  requirements responsibilities responsibility role skill skills solid strong team teams understanding using
  work working world year years bonus nice have who what will want also people make sure etc based related
  within least minimum must hands-on hands various well-versed good-to-have end background exposure everyday
  improve build building collaborate collaborating junior senior own owning operate part such like get use used
  create develop design ensure support across closely together fast-paced dynamic passionate love enjoy every
  day-to-day write writes take takes thing things way ways best looking seeking key core primary high level
  hiring hire hires growing growth professional tools tool`.split(/\s+/),
)

/** Fold typographic punctuation into ASCII so regexes behave predictably. */
export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/ /g, ' ')
    .replace(/\r\n?/g, '\n')
}

/** Lower-case word tokens. Keeps tech-ish punctuation like c++, c#, node.js. */
export function tokenize(text: string): string[] {
  return normalize(text).toLowerCase().match(/[a-z][a-z0-9+#]*(?:[.-][a-z0-9+#]+)*/g) ?? []
}

/**
 * A deliberately small suffix stripper. It only needs to make "scaling",
 * "scaled" and "scales" collide; it does not need to be linguistically correct.
 */
export function stem(word: string): string {
  if (word.length <= 4 || /[^a-z]/.test(word)) return word
  for (const [suffix, min] of [
    ['ations', 5],
    ['ation', 5],
    ['ments', 5],
    ['ment', 5],
    ['ings', 4],
    ['ing', 4],
    ['ies', 3],
    ['ied', 3],
    ['ed', 4],
    ['es', 4],
    ['s', 4],
  ] as const) {
    if (word.endsWith(suffix) && word.length - suffix.length >= min) {
      const base = word.slice(0, -suffix.length)
      if (suffix === 'ies' || suffix === 'ied') return base + 'y'
      if (suffix === 's' && base.endsWith('s')) return word
      return base
    }
  }
  return word
}

/** Content words: tokens that are not stopwords, generic filler, or too short. */
export function contentTokens(text: string): string[] {
  return tokenize(text).filter((t) => t.length > 2 && !STOPWORDS.has(t) && !GENERIC_WORDS.has(t))
}

export const countWords = (text: string) => (text.trim().match(/\S+/g) ?? []).length
