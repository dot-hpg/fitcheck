/**
 * Skill taxonomy used to detect technologies and practices in free text.
 *
 * `aliases` are matched case-insensitively. `exact` aliases are matched
 * case-sensitively, which lets us detect short, ambiguous names like "Go",
 * "R" or "C" without matching every English sentence that contains "go".
 */
export type SkillCategory =
  | 'Languages'
  | 'Frontend'
  | 'Backend'
  | 'Databases'
  | 'Cloud & DevOps'
  | 'Data & AI'
  | 'Testing'
  | 'Practices'
  | 'Fundamentals'

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  aliases: string[]
  exact?: string[]
}

const s = (
  id: string,
  name: string,
  category: SkillCategory,
  aliases: string[] = [],
  exact: string[] = [],
): Skill => ({
  id,
  name,
  category,
  // A name listed in `exact` is ambiguous in lower case, so it is only matched case-sensitively.
  aliases: exact.includes(name) ? aliases : [name.toLowerCase(), ...aliases],
  exact,
})

export const SKILLS: Skill[] = [
  // Languages
  s('javascript', 'JavaScript', 'Languages', ['js', 'es6', 'ecmascript']),
  s('typescript', 'TypeScript', 'Languages', ['ts']),
  s('python', 'Python', 'Languages', ['python3']),
  s('java', 'Java', 'Languages', ['java 8', 'java 11', 'java 17', 'java 21']),
  s('kotlin', 'Kotlin', 'Languages'),
  s('go', 'Go', 'Languages', ['golang'], ['Go']),
  s('rust', 'Rust', 'Languages'),
  s('cpp', 'C++', 'Languages', ['cpp']),
  s('c', 'C', 'Languages', [], ['C']),
  s('csharp', 'C#', 'Languages', ['c sharp']),
  s('ruby', 'Ruby', 'Languages'),
  s('php', 'PHP', 'Languages'),
  s('swift', 'Swift', 'Languages', ['swiftui'], ['Swift']),
  s('scala', 'Scala', 'Languages'),
  s('r', 'R', 'Languages', [], ['R']),
  s('sql', 'SQL', 'Languages', ['t-sql', 'pl/sql']),
  s('bash', 'Bash', 'Languages', ['shell scripting', 'shell script', 'zsh']),
  s('dart', 'Dart', 'Languages'),

  // Frontend
  s('react', 'React', 'Frontend', ['react.js', 'reactjs']),
  s('nextjs', 'Next.js', 'Frontend', ['nextjs', 'next js']),
  s('vue', 'Vue', 'Frontend', ['vue.js', 'vuejs', 'nuxt']),
  s('angular', 'Angular', 'Frontend', ['angularjs']),
  s('svelte', 'Svelte', 'Frontend', ['sveltekit']),
  s('html', 'HTML', 'Frontend', ['html5']),
  s('css', 'CSS', 'Frontend', ['css3', 'scss', 'sass']),
  s('tailwind', 'Tailwind CSS', 'Frontend', ['tailwind', 'tailwindcss']),
  s('redux', 'Redux', 'Frontend', ['redux toolkit', 'zustand']),
  s('react-native', 'React Native', 'Frontend', ['react-native']),
  s('flutter', 'Flutter', 'Frontend'),
  s('webpack', 'Webpack', 'Frontend', ['vite', 'esbuild']),
  s('a11y', 'Accessibility', 'Frontend', ['a11y', 'wcag']),

  // Backend
  s('nodejs', 'Node.js', 'Backend', ['node', 'nodejs', 'node js']),
  s('express', 'Express', 'Backend', ['express.js', 'expressjs'], ['Express']),
  s('nestjs', 'NestJS', 'Backend', ['nest.js']),
  s('django', 'Django', 'Backend'),
  s('flask', 'Flask', 'Backend'),
  s('fastapi', 'FastAPI', 'Backend'),
  s('spring', 'Spring Boot', 'Backend', ['springboot', 'spring framework', 'spring mvc', 'spring cloud']),
  s('dotnet', '.NET', 'Backend', ['asp.net', 'dotnet', '.net core']),
  s('rails', 'Ruby on Rails', 'Backend', ['rails']),
  s('rest', 'REST APIs', 'Backend', ['restful', 'rest api', 'restful apis', 'restful api'], ['REST']),
  s('graphql', 'GraphQL', 'Backend', ['apollo']),
  s('grpc', 'gRPC', 'Backend', ['protobuf', 'protocol buffers']),
  s('microservices', 'Microservices', 'Backend', ['microservice', 'micro-services', 'service-oriented architecture']),
  s('kafka', 'Kafka', 'Backend', ['apache kafka']),
  s('rabbitmq', 'RabbitMQ', 'Backend', ['message queue', 'message queues', 'amazon sqs', 'sqs']),
  s('websockets', 'WebSockets', 'Backend', ['websocket', 'socket.io']),
  s('oauth', 'OAuth', 'Backend', ['oauth2', 'jwt', 'openid connect', 'oidc']),

  // Databases
  s('postgresql', 'PostgreSQL', 'Databases', ['postgres', 'postgresql', 'psql']),
  s('mysql', 'MySQL', 'Databases', ['mariadb']),
  s('mongodb', 'MongoDB', 'Databases', ['mongo', 'mongoose']),
  s('redis', 'Redis', 'Databases', ['memcached']),
  s('elasticsearch', 'Elasticsearch', 'Databases', ['elastic search', 'opensearch']),
  s('dynamodb', 'DynamoDB', 'Databases', ['dynamo db']),
  s('cassandra', 'Cassandra', 'Databases', ['scylladb']),
  s('sqlite', 'SQLite', 'Databases'),
  s('firebase', 'Firebase', 'Databases', ['firestore', 'supabase']),
  s('orm', 'ORM', 'Databases', ['prisma', 'hibernate', 'sqlalchemy', 'typeorm', 'sequelize', 'drizzle']),

  // Cloud & DevOps
  s('aws', 'AWS', 'Cloud & DevOps', ['amazon web services', 'ec2', 's3', 'lambda', 'aws lambda']),
  s('gcp', 'GCP', 'Cloud & DevOps', ['google cloud', 'google cloud platform', 'bigquery']),
  s('azure', 'Azure', 'Cloud & DevOps', ['microsoft azure']),
  s('docker', 'Docker', 'Cloud & DevOps', ['containers', 'containerization', 'dockerized']),
  s('kubernetes', 'Kubernetes', 'Cloud & DevOps', ['k8s', 'helm', 'eks', 'gke', 'aks']),
  s('terraform', 'Terraform', 'Cloud & DevOps', ['infrastructure as code', 'iac', 'pulumi', 'cloudformation']),
  s('cicd', 'CI/CD', 'Cloud & DevOps', ['ci/cd', 'ci-cd', 'continuous integration', 'continuous delivery', 'continuous deployment', 'github actions', 'jenkins', 'gitlab ci', 'circleci']),
  s('linux', 'Linux', 'Cloud & DevOps', ['unix', 'ubuntu']),
  s('nginx', 'Nginx', 'Cloud & DevOps', ['load balancer', 'load balancing', 'reverse proxy']),
  s('observability', 'Observability', 'Cloud & DevOps', ['monitoring', 'prometheus', 'grafana', 'datadog', 'opentelemetry', 'new relic', 'logging']),
  s('serverless', 'Serverless', 'Cloud & DevOps', ['cloud functions', 'vercel', 'netlify']),

  // Data & AI
  s('ml', 'Machine Learning', 'Data & AI', ['machine learning', 'ml', 'scikit-learn', 'sklearn']),
  s('dl', 'Deep Learning', 'Data & AI', ['deep learning', 'neural networks', 'neural network']),
  s('pytorch', 'PyTorch', 'Data & AI', ['torch']),
  s('tensorflow', 'TensorFlow', 'Data & AI', ['keras']),
  s('llm', 'LLMs', 'Data & AI', ['llm', 'llms', 'large language models', 'large language model', 'generative ai', 'genai', 'gpt', 'claude', 'prompt engineering']),
  s('rag', 'RAG', 'Data & AI', ['retrieval augmented generation', 'retrieval-augmented generation', 'vector database', 'vector db', 'embeddings', 'pinecone', 'pgvector']),
  s('nlp', 'NLP', 'Data & AI', ['natural language processing', 'hugging face', 'huggingface', 'transformers']),
  s('cv', 'Computer Vision', 'Data & AI', ['computer vision', 'opencv', 'image processing']),
  s('pandas', 'Pandas', 'Data & AI', ['numpy', 'dataframes']),
  s('spark', 'Spark', 'Data & AI', ['apache spark', 'pyspark', 'hadoop', 'databricks'], ['Spark']),
  s('airflow', 'Airflow', 'Data & AI', ['apache airflow', 'etl', 'data pipeline', 'data pipelines', 'dbt']),
  s('data-viz', 'Data Visualization', 'Data & AI', ['data visualization', 'tableau', 'power bi', 'matplotlib', 'd3.js', 'looker']),
  s('statistics', 'Statistics', 'Data & AI', ['statistical analysis', 'a/b testing', 'hypothesis testing']),

  // Testing
  s('unit-testing', 'Unit Testing', 'Testing', ['unit tests', 'unit test', 'jest', 'vitest', 'pytest', 'junit', 'mocha', 'tdd', 'test-driven development']),
  s('e2e-testing', 'E2E Testing', 'Testing', ['end-to-end testing', 'e2e tests', 'cypress', 'playwright', 'selenium', 'integration tests', 'integration testing']),
  s('load-testing', 'Performance Testing', 'Testing', ['load testing', 'performance testing', 'k6', 'jmeter', 'locust']),

  // Practices
  s('git', 'Git', 'Practices', ['github', 'gitlab', 'bitbucket', 'version control']),
  s('agile', 'Agile', 'Practices', ['scrum', 'kanban', 'sprint planning']),
  s('code-review', 'Code Review', 'Practices', ['code reviews', 'pull requests', 'peer review']),
  s('system-design', 'System Design', 'Practices', ['system design', 'distributed systems', 'scalable systems', 'high availability', 'scalability', 'architecture design']),
  s('security', 'Security', 'Practices', ['application security', 'owasp', 'encryption', 'authentication', 'authorization']),
  s('mentoring', 'Mentoring', 'Practices', ['mentored', 'mentorship', 'mentor']),
  s('communication', 'Communication', 'Practices', ['stakeholder management', 'cross-functional', 'cross functional', 'written communication']),

  // Fundamentals
  s('dsa', 'Data Structures & Algorithms', 'Fundamentals', ['data structures', 'algorithms', 'dsa', 'competitive programming', 'leetcode']),
  s('oop', 'OOP', 'Fundamentals', ['object-oriented', 'object oriented', 'object-oriented programming', 'design patterns', 'solid principles']),
  s('dbms', 'Database Design', 'Fundamentals', ['database design', 'data modeling', 'schema design', 'normalization', 'indexing', 'query optimization']),
  s('os', 'Operating Systems', 'Fundamentals', ['operating systems', 'multithreading', 'concurrency', 'multi-threading']),
  s('networking', 'Networking', 'Fundamentals', ['computer networks', 'tcp/ip', 'http', 'dns']),
  s('caching', 'Caching', 'Fundamentals', ['caching', 'cache', 'cdn']),
]

export const SKILL_BY_ID: ReadonlyMap<string, Skill> = new Map(SKILLS.map((sk) => [sk.id, sk]))

/** Characters that count as part of a "word" when checking skill boundaries. */
const WORD_CHAR = 'a-zA-Z0-9+#&'

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

interface CompiledSkill {
  skill: Skill
  insensitive: RegExp | null
  sensitive: RegExp | null
}

function compile(skill: Skill): CompiledSkill {
  const alt = (list: string[]) =>
    [...new Set(list)]
      // Longest first so "react native" wins over "react" inside the alternation.
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join('|')
  // Short lowercase aliases like "ts", "ml" or "js" are too noisy to match
  // case-insensitively; they must appear in upper case (TS, ML, JS).
  const loose = skill.aliases.filter((a) => a.length > 2 || /[^a-z]/.test(a))
  const strict = [...(skill.exact ?? []), ...skill.aliases.filter((a) => !loose.includes(a)).map((a) => a.toUpperCase())]
  const boundary = (body: string, flags: string) =>
    new RegExp(`(?<![${WORD_CHAR}.])(?:${body})(?![${WORD_CHAR}]|-[a-zA-Z])`, flags)
  return {
    skill,
    insensitive: loose.length ? boundary(alt(loose), 'gi') : null,
    sensitive: strict.length ? boundary(alt(strict), 'g') : null,
  }
}

const COMPILED = SKILLS.map(compile)

export interface SkillHit {
  skill: Skill
  count: number
}

/** Find every taxonomy skill mentioned in `text`, with a mention count. */
export function extractSkills(text: string): Map<string, SkillHit> {
  const hits = new Map<string, SkillHit>()
  for (const { skill, insensitive, sensitive } of COMPILED) {
    let count = 0
    if (insensitive) count += text.match(insensitive)?.length ?? 0
    if (sensitive) count += text.match(sensitive)?.length ?? 0
    if (count > 0) hits.set(skill.id, { skill, count })
  }
  return hits
}
