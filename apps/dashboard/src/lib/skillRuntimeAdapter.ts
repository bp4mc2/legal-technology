/**
 * src/lib/skillRuntimeAdapter.ts
 *
 * Runtime adapter om geselecteerde Copilot skills uit /.github/skills/[skill]/SKILL.md
 * in de system prompt op te nemen. Zo delen de app en Copilot slash skills
 * dezelfde broninstructies.
 */

const SKILL_MODULES = import.meta.glob<string>('/.github/skills/*/SKILL.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface SkillDoc {
  name: string
  description: string
  body: string
}

function parseFrontMatter(content: string): { front: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { front: {}, body: content.trim() }

  const frontRaw = match[1]
  const body = match[2].trim()
  const front: Record<string, string> = {}

  for (const line of frontRaw.split('\n')) {
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    front[key] = value
  }

  return { front, body }
}

function folderNameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 2] ?? ''
}

function getAllSkills(): SkillDoc[] {
  return Object.entries(SKILL_MODULES).map(([path, raw]) => {
    const { front, body } = parseFrontMatter(raw)
    const folder = folderNameFromPath(path)
    return {
      name: front.name || folder,
      description: front.description || '',
      body,
    }
  })
}

function normaliseerSkillName(name: string): string {
  return name.trim().toLowerCase()
}

export function skillForPersona(personaId: string): string {
  return `p-${personaId}`
}

export function buildSkillInjectedSystemPrompt(baseSystemPrompt: string, selectedSkills: string[] = []): string {
  const normalized = Array.from(new Set(selectedSkills.map(normaliseerSkillName))).filter(Boolean)
  if (normalized.length === 0) return baseSystemPrompt

  const allSkills = getAllSkills()
  const selected = allSkills.filter(s => normalized.includes(normaliseerSkillName(s.name)))
  if (selected.length === 0) return baseSystemPrompt

  const skillSections = selected
    .map(s => {
      const desc = s.description ? `Omschrijving: ${s.description}` : 'Omschrijving: (geen)'
      return `## Skill ${s.name}\n${desc}\n\n${s.body}`
    })
    .join('\n\n')

  return [
    baseSystemPrompt,
    '---',
    'Aanvullende runtime-instructies uit Copilot Skills:',
    skillSections,
    'Gebruik deze skill-instructies als leidende context naast de basisrol.',
  ].join('\n\n')
}
