/**
 * src/lib/promptLoader.ts
 *
 * Laadt markdown-promptbestanden in en vervangt {{variabele}} placeholders.
 *
 * Alle promptbestanden staan in /.github/prompts/ en worden via Vite's
 * import.meta.glob ingeladen — geen fetch nodig, werkt ook offline.
 *
 * Gebruik:
 *   const prompt = await loadPrompt('skills/drieluik', { wijziging: '...' })
 */

// Vite laadt alle Copilot promptbestanden in de .github/prompts-map als raw strings
// De `?raw` suffix zorgt dat de inhoud als string binnenkomt, niet als module
const PROMPT_MODULES = import.meta.glob<string>('/.github/prompts/*.prompt.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const PROMPT_PREFIXES: Record<string, string> = {
  skills: 'skill',
  personas: 'persona',
  workflows: 'workflow',
}

function naarPromptBestand(pad: string): string {
  const [categorie, ...rest] = pad.split('/')
  const naam = rest.join('/')
  const prefix = PROMPT_PREFIXES[categorie]

  if (!prefix || !naam || naam.includes('/')) {
    throw new Error(`Ongeldig promptpad: "${pad}"`)
  }

  return `/.github/prompts/${prefix}-${naam}.prompt.md`
}

function naarLogischPad(sleutel: string): string {
  const bestandsnaam = sleutel
    .replace('/.github/prompts/', '')
    .replace('.prompt.md', '')

  for (const [categorie, prefix] of Object.entries(PROMPT_PREFIXES)) {
    if (bestandsnaam.startsWith(`${prefix}-`)) {
      return `${categorie}/${bestandsnaam.slice(prefix.length + 1)}`
    }
  }

  return bestandsnaam
}

export type PromptVariabelen = Record<string, string>

/**
 * Laad een promptbestand en vervang variabelen.
 *
 * @param pad  Logisch pad relatief aan de promptcollectie, zonder extensie
 *             Bijv. 'skills/drieluik' of 'personas/analist'
 * @param vars Variabelen om te vervangen: { wijziging: 'tekst', ... }
 */
export function loadPrompt(pad: string, vars: PromptVariabelen = {}): string {
  const sleutel = naarPromptBestand(pad)
  const inhoud = PROMPT_MODULES[sleutel]

  if (!inhoud) {
    const beschikbaar = Object.keys(PROMPT_MODULES).join('\n  ')
    throw new Error(
      `Prompt niet gevonden: "${sleutel}"\n` +
      `Beschikbare prompts:\n  ${beschikbaar}`
    )
  }

  return vervangVariabelen(inhoud, vars)
}

/**
 * Laad een promptbestand en geef de ruwe inhoud terug (voor debugging).
 */
export function getRawPrompt(pad: string): string {
  return loadPrompt(pad, {})
}

/**
 * Vervang {{variabele}} placeholders in een prompttekst.
 * Ondersteunt ook {{#conditie}}tekst{{/conditie}} blokken.
 */
function vervangVariabelen(tekst: string, vars: PromptVariabelen): string {
  // Verwijder YAML front matter (--- ... ---)
  let resultaat = tekst.replace(/^---[\s\S]*?---\n/, '')

  // Verwijder CLI-voorbeeldblokken uit de uiteindelijke prompt
  // (die zijn alleen voor de gebruiker, niet voor het model)
  resultaat = resultaat.replace(/## CLI gebruik[\s\S]*?(?=\n## |\n---|\Z)/g, '')

  // Vervang conditionele blokken {{#var}}tekst{{/var}}
  resultaat = resultaat.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, naam, inhoud) => (vars[naam] ? inhoud : '')
  )

  // Vervang gewone {{variabele}} placeholders
  resultaat = resultaat.replace(/\{\{(\w+)\}\}/g, (_match, naam) => {
    if (naam in vars) return vars[naam]
    // Laat onbekende variabelen staan met een waarschuwing
    console.warn(`[promptLoader] Variabele niet opgegeven: {{${naam}}}`)
    return `[${naam} — niet opgegeven]`
  })

  return resultaat.trim()
}

/**
 * Combineer meerdere persona-prompts tot één samengestelde systeemprompt.
 * Handig voor multi-persona analyses.
 */
export function combineerPersonas(personaIds: string[]): string {
  return personaIds
    .map(id => {
      try {
        const inhoud = getRawPrompt(`personas/${id}`)
        // Neem alleen de beschrijving (eerste paar alinea's, zonder koppen)
        const regels = inhoud.split('\n')
        const beschrijving = regels
          .filter(r => !r.startsWith('#') && !r.startsWith('```') && r.trim())
          .slice(0, 4)
          .join(' ')
        return `**${id}:** ${beschrijving}`
      } catch {
        return `**${id}:** (persona niet gevonden)`
      }
    })
    .join('\n\n')
}

/**
 * Geef een lijst van alle beschikbare prompts.
 */
export function lijstPrompts(): { pad: string; categorie: string; naam: string }[] {
  return Object.keys(PROMPT_MODULES).map(sleutel => {
    const logischPad = naarLogischPad(sleutel)
    const delen = logischPad.split('/')
    return {
      pad: logischPad,
      categorie: delen[0] ?? 'overig',
      naam: delen[1] ?? delen[0],
    }
  })
}
