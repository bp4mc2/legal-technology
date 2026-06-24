/**
 * src/lib/contextLoader.ts
 *
 * Laadt context.yaml bestanden per klant/opdracht en bouwt een gecombineerde
 * context op van markdowns die meegaan in AI-prompts.
 *
 * Twee niveaus:
 *   1. Klant-niveau:   data/klanten/<slug>/context.yaml
 *   2. Opdracht-niveau: data/klanten/<slug>/opdrachten/<slug>/context.yaml
 *
 * Opdracht-context voegt toe aan klant-context.
 */

// Vite laadt alle bestanden in data/ als raw strings
const MD_MODULES = import.meta.glob('/data/klanten/**/*.md', { as: 'raw', eager: true })
const YAML_MODULES = import.meta.glob('/data/klanten/**/*.yaml', { as: 'raw', eager: true })

export type WorkflowId = 'intake' | 'drieluik' | 'interview' | 'architectuur' | 'document' | 'presentatie' | 'stakeholder-map'
export type PersonaId = string

export interface ContextEntry {
  pad: string
  beschrijving: string
  actief?: boolean
}

export interface ContextConfig {
  altijd: ContextEntry[]
  per_workflow: Partial<Record<WorkflowId, ContextEntry[]>>
  per_persona: Record<string, ContextEntry[]>
  uitgesloten: ContextEntry[]
}

export interface GeladeContext {
  klant: string
  opdracht?: string
  markdowns: {
    altijd: { pad: string; beschrijving: string; inhoud: string }[]
    workflow: { pad: string; beschrijving: string; inhoud: string }[]
    persona: { pad: string; beschrijving: string; inhoud: string }[]
  }
  samengevoegd: string   // Alle relevante markdowns aaneengesloten voor prompt-gebruik
}

// ─── YAML parser (minimaal, voor onze context.yaml structuur) ─────────────────
// We gebruiken geen externe YAML-library om dependencies beperkt te houden.
// De context.yaml heeft een vaste, voorspelbare structuur.

function parseContextYaml(yaml: string): ContextConfig {
  // Verwijder comments
  const schoon = yaml.split('\n')
    .filter(r => !r.trimStart().startsWith('#'))
    .join('\n')

  const config: ContextConfig = {
    altijd: [],
    per_workflow: {},
    per_persona: {},
    uitgesloten: [],
  }

  // Parse altijd-blok
  const altijdMatch = schoon.match(/altijd:\n([\s\S]*?)(?=\n  \w|\n\w|$)/)
  if (altijdMatch) {
    config.altijd = parseEntries(altijdMatch[1])
  }

  // Parse per_workflow blokken
  const workflowMatch = schoon.match(/per_workflow:\n([\s\S]*?)(?=\n  per_persona|\n  uitgesloten|\n\w|$)/)
  if (workflowMatch) {
    const workflowTekst = workflowMatch[1]
    const workflowNamen: WorkflowId[] = ['intake', 'drieluik', 'interview', 'architectuur', 'document', 'presentatie', 'stakeholder-map']
    for (const naam of workflowNamen) {
      const match = workflowTekst.match(new RegExp(`${naam}:\\n([\\s\\S]*?)(?=\\n    \\w|\\n  \\w|$)`))
      if (match) {
        config.per_workflow[naam] = parseEntries(match[1])
      }
    }
  }

  // Parse per_persona blokken
  const personaMatch = schoon.match(/per_persona:\n([\s\S]*?)(?=\n  uitgesloten|\n\w|$)/)
  if (personaMatch) {
    const personaTekst = personaMatch[1]
    const personaRegel = /    "?([a-z-]+)"?:\n([\s\S]*?)(?=\n    "?[a-z]|\n  \w|$)/g
    let m
    while ((m = personaRegel.exec(personaTekst)) !== null) {
      config.per_persona[m[1]] = parseEntries(m[2])
    }
  }

  return config
}

function parseEntries(tekst: string): ContextEntry[] {
  const entries: ContextEntry[] = []
  const padRegex = /- pad:\s*"([^"]+)"/g
  const beschrijvingRegex = /beschrijving:\s*"([^"]+)"/g

  const pads: string[] = []
  const beschrijvingen: string[] = []

  let m
  while ((m = padRegex.exec(tekst)) !== null) pads.push(m[1])
  while ((m = beschrijvingRegex.exec(tekst)) !== null) beschrijvingen.push(m[1])

  for (let i = 0; i < pads.length; i++) {
    entries.push({ pad: pads[i], beschrijving: beschrijvingen[i] ?? '' })
  }

  return entries
}

// ─── Markdown-inhoud ophalen ──────────────────────────────────────────────────

function laadMarkdown(basisPad: string, relatief: string): string | null {
  const volledigPad = `${basisPad}/${relatief}`.replace('//', '/')
  const sleutel = volledigPad.startsWith('/data') ? volledigPad : `/data/${volledigPad}`
  return MD_MODULES[sleutel] ?? null
}

function laadYaml(sleutel: string): string | null {
  return YAML_MODULES[sleutel] ?? null
}

// ─── Hoofdfunctie: laad volledige context voor klant + opdracht ───────────────

export function laadContext(
  klantSlug: string,
  opdrachtSlug?: string,
  workflow?: WorkflowId,
  personaIds: PersonaId[] = []
): GeladeContext {
  const klantBasis = `/data/klanten/${klantSlug}`
  const opdrachtBasis = opdrachtSlug
    ? `${klantBasis}/opdrachten/${opdrachtSlug}`
    : null

  // Laad context.yaml bestanden
  const klantContextYaml = laadYaml(`${klantBasis}/context.yaml`)
  const opdrachtContextYaml = opdrachtBasis ? laadYaml(`${opdrachtBasis}/context.yaml`) : null

  const klantConfig = klantContextYaml ? parseContextYaml(klantContextYaml) : legeConfig()
  const opdrachtConfig = opdrachtContextYaml ? parseContextYaml(opdrachtContextYaml) : legeConfig()

  // Bouw uitgesloten-lijst
  const uitgesloten = new Set([
    ...klantConfig.uitgesloten.map(e => e.pad),
    ...opdrachtConfig.uitgesloten.map(e => e.pad),
  ])

  // Helper: laad een entry als hij niet uitgesloten is
  function laadEntry(entry: ContextEntry, basis: string) {
    if (uitgesloten.has(entry.pad)) return null
    const inhoud = laadMarkdown(basis, entry.pad)
    if (!inhoud) {
      console.warn(`[contextLoader] Markdown niet gevonden: ${basis}/${entry.pad}`)
      return null
    }
    return { pad: entry.pad, beschrijving: entry.beschrijving, inhoud }
  }

  // Altijd-markdowns (klant + opdracht)
  const altijdMarkdowns = [
    ...klantConfig.altijd.map(e => laadEntry(e, klantBasis)),
    ...(opdrachtConfig.altijd.map(e => laadEntry(e, opdrachtBasis ?? klantBasis))),
  ].filter(Boolean) as { pad: string; beschrijving: string; inhoud: string }[]

  // Workflow-markdowns
  const workflowMarkdowns = workflow ? [
    ...(klantConfig.per_workflow[workflow] ?? []).map(e => laadEntry(e, klantBasis)),
    ...(opdrachtConfig.per_workflow[workflow] ?? []).map(e => laadEntry(e, opdrachtBasis ?? klantBasis)),
  ].filter(Boolean) as { pad: string; beschrijving: string; inhoud: string }[] : []

  // Persona-markdowns
  const personaMarkdowns = personaIds.flatMap(pid => [
    ...(klantConfig.per_persona[pid] ?? []).map(e => laadEntry(e, klantBasis)),
    ...(opdrachtConfig.per_persona?.[pid] ?? []).map(e => laadEntry(e, opdrachtBasis ?? klantBasis)),
  ]).filter(Boolean) as { pad: string; beschrijving: string; inhoud: string }[]

  // Dedupliceer op pad
  const gezien = new Set<string>()
  const dedup = (lijst: typeof altijdMarkdowns) =>
    lijst.filter(m => { if (gezien.has(m.pad)) return false; gezien.add(m.pad); return true })

  const alleAltijd = dedup(altijdMarkdowns)
  const alleWorkflow = dedup(workflowMarkdowns)
  const allePersona = dedup(personaMarkdowns)

  // Bouw samengevoegde context-string voor gebruik in prompt
  const secties = [
    alleAltijd.length > 0 && `## Klant- en opdrachtcontext\n\n${alleAltijd.map(m => `### ${m.beschrijving}\n\n${m.inhoud}`).join('\n\n---\n\n')}`,
    alleWorkflow.length > 0 && `## Workflow-context\n\n${alleWorkflow.map(m => `### ${m.beschrijving}\n\n${m.inhoud}`).join('\n\n---\n\n')}`,
    allePersona.length > 0 && `## Persona-context\n\n${allePersona.map(m => `### ${m.beschrijving}\n\n${m.inhoud}`).join('\n\n---\n\n')}`,
  ].filter(Boolean)

  return {
    klant: klantSlug,
    opdracht: opdrachtSlug,
    markdowns: {
      altijd: alleAltijd,
      workflow: alleWorkflow,
      persona: allePersona,
    },
    samengevoegd: secties.join('\n\n'),
  }
}

function legeConfig(): ContextConfig {
  return { altijd: [], per_workflow: {}, per_persona: {}, uitgesloten: [] }
}

/**
 * Geef een overzicht van alle beschikbare markdowns voor een klant/opdracht.
 * Handig voor de UI om te tonen wat er beschikbaar is.
 */
export function lijstBeschikbareMarkdowns(klantSlug: string, opdrachtSlug?: string) {
  const prefix = opdrachtSlug
    ? `/data/klanten/${klantSlug}/opdrachten/${opdrachtSlug}/markdowns/`
    : `/data/klanten/${klantSlug}/markdowns/`

  return Object.keys(MD_MODULES)
    .filter(k => k.startsWith(prefix))
    .map(k => ({
      pad: k.replace(prefix, ''),
      volledigPad: k,
    }))
}
