/**
 * src/lib/aiClient.ts
 *
 * Centrale AI-client — gebruikt de GitHub Models API.
 * Deze API is OpenAI-compatibel en beschikbaar voor alle GitHub Copilot gebruikers.
 *
 * Setup:
 *   1. Maak een .env bestand aan in de root van het project
 *   2. Voeg toe: VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
 *   3. Genereer een token op: https://github.com/settings/tokens
 *      (geen scopes nodig voor GitHub Models)
 *
 * GitHub Models documentatie:
 *   https://docs.github.com/en/github-models
 *
 * Beschikbare modellen (voorbeeldnamen):
 *   - gpt-4o                      (krachtigste, voor drieluik / architectuur)
 *   - gpt-4o-mini                 (snel en goedkoop, voor samenvattingen)
 *   - Meta-Llama-3.1-8B-Instruct  (open source alternatief)
 *
 * Let op: model-id's verschillen per endpoint. Controleer /models als een id niet werkt.
 */

import { buildSkillInjectedSystemPrompt } from '../lib/skillRuntimeAdapter'

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions'

// Model aliases — pas hier aan om het model te wisselen
export const MODELS = {
  // Primair model: krachtig genoeg voor drieluik, architectuur, intake
  primary: 'gpt-4o',
  // Snel model: samenvattingen, document conversie, eenvoudige taken
  fast: 'gpt-4o-mini',
} as const

export type ModelAlias = keyof typeof MODELS

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICallOptions {
  model?: ModelAlias
  maxTokens?: number
  temperature?: number
}

export interface AISkillCallOptions extends AICallOptions {
  skills?: string[]
}

/**
 * Roep de GitHub Models API aan.
 * Gooit een fout als VITE_GITHUB_TOKEN niet is ingesteld.
 */
export async function callAI(
  messages: AIMessage[],
  options: AICallOptions = {}
): Promise<string> {
  const token = import.meta.env.VITE_GITHUB_TOKEN

  if (!token) {
    throw new Error(
      'VITE_GITHUB_TOKEN is niet ingesteld.\n' +
      'Maak een .env bestand aan met: VITE_GITHUB_TOKEN=ghp_...\n' +
      'Genereer een token op: https://github.com/settings/tokens'
    )
  }

  const model = MODELS[options.model ?? 'primary']

  const response = await fetch(GITHUB_MODELS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.3,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`GitHub Models API fout (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * Hulpfunctie: systeem + gebruiker bericht in één aanroep.
 */
export async function callAIWithSystem(
  systemPrompt: string,
  userPrompt: string,
  options: AICallOptions = {}
): Promise<string> {
  return callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    options
  )
}

/**
 * Hulpfunctie: systeem + gebruiker bericht, met optionele skill-injectie
 * vanuit /.github/skills/[skill]/SKILL.md.
 */
export async function callAIWithSystemSkills(
  systemPrompt: string,
  userPrompt: string,
  options: AISkillCallOptions = {}
): Promise<string> {
  const { skills = [], ...rest } = options
  const runtimeSystemPrompt = buildSkillInjectedSystemPrompt(systemPrompt, skills)
  return callAIWithSystem(runtimeSystemPrompt, userPrompt, rest)
}

/**
 * React hook: useAI
 * Drop-in vervanging voor de oude useClaudeCall hook.
 */
import { useState } from 'react'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function call(
    systemPrompt: string,
    userPrompt: string,
    options: AICallOptions = {}
  ): Promise<string | null> {
    setLoading(true)
    setError(null)
    try {
      const result = await callAIWithSystem(systemPrompt, userPrompt, options)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { call, loading, error }
}
