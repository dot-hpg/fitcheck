import { describe, expect, it } from 'vitest'
import { extractSkills, SKILLS } from './skills'

const ids = (text: string) => [...extractSkills(text).keys()].sort()

describe('extractSkills', () => {
  it('finds skills through their aliases', () => {
    expect(ids('Built services in Golang with Postgres and k8s')).toEqual(['go', 'kubernetes', 'postgresql'])
  })

  it('handles symbols in names like C++, C# and Node.js', () => {
    expect(ids('Fluent in C++ and C#, some Node.js.')).toEqual(['cpp', 'csharp', 'nodejs'])
  })

  it('matches ambiguous short names only in their exact case', () => {
    expect(ids('We go to great lengths to rest well')).toEqual([])
    expect(ids('Services written in Go behind a REST gateway')).toEqual(['go', 'rest'])
  })

  it('needs short aliases like ML and TS in upper case', () => {
    expect(ids('the ts and ml files')).toEqual([])
    expect(ids('Applied ML in TS')).toEqual(['ml', 'typescript'])
  })

  it('does not match a skill inside a longer word', () => {
    expect(ids('JavaScript and NoSQL')).toEqual(['javascript'])
    expect(ids('the nodes of a graph')).toEqual([])
  })

  it('counts every mention', () => {
    expect(extractSkills('Docker, docker and containerization').get('docker')?.count).toBe(3)
  })

  it('has unique ids', () => {
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length)
  })
})
