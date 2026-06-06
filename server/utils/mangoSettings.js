import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/*
  Helpers for reading/writing the Mango project's settings.json from server
  routes. The OpenAI key for the AI assistant is stored there (alongside the
  other provider secrets like resendKey / s3AccessKeySecret), and we read it
  fresh from disk on each request so a key pasted into the UI takes effect
  immediately — no rebuild required.
*/

function settingsPath() {
  const config = useRuntimeConfig()
  return join(config.mangoConfigPath, 'settings.json')
}

export function readSettings() {
  try {
    return JSON.parse(readFileSync(settingsPath(), 'utf8'))
  } catch {
    return {}
  }
}

export function writeSettings(next) {
  // settings.json is tab-indented in the template; keep that style.
  writeFileSync(settingsPath(), JSON.stringify(next, null, '\t') + '\n')
}

// Resolve the key: settings.json wins, then the OPENAI_API_KEY env var.
export function resolveOpenAiKey() {
  const config = useRuntimeConfig()
  const settings = readSettings()
  const fromSettings = settings.openaiApiKey && String(settings.openaiApiKey).trim()
  if (fromSettings) return { key: fromSettings, source: 'settings' }
  if (config.openaiApiKey) return { key: config.openaiApiKey, source: 'env' }
  return { key: null, source: null }
}

export function saveOpenAiKey(key) {
  const settings = readSettings()
  settings.openaiApiKey = key
  writeSettings(settings)
}
