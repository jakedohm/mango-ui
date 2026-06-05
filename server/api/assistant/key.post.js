/*
  Persists an OpenAI API key the user pastes into the UI to the Mango project's
  settings.json (key: "openaiApiKey"), next to the other provider secrets. The
  key never leaves the server beyond the OpenAI proxy calls. Read fresh on each
  request, so it takes effect immediately.
*/
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const key = (body?.key || '').trim()

  if (!key) {
    setResponseStatus(event, 400)
    return { error: 'missing_key', message: 'No key provided.' }
  }
  if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) {
    setResponseStatus(event, 400)
    return {
      error: 'invalid_key',
      message: 'That does not look like an OpenAI API key (expected to start with "sk-").'
    }
  }

  try {
    saveOpenAiKey(key)
  } catch (e) {
    setResponseStatus(event, 500)
    return { error: 'write_failed', message: e?.message || 'Could not save the key.' }
  }

  return { configured: true, source: 'settings' }
})
