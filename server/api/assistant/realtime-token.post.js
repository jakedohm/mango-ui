/*
  Mints a short-lived ephemeral token for the OpenAI Realtime API so the browser
  can open a WebRTC voice session directly without ever seeing the real key.
  The client posts the desired voice + instructions; we attach the model.
*/
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const { key: apiKey } = resolveOpenAiKey()
  if (!apiKey) {
    setResponseStatus(event, 503)
    return {
      error: 'assistant_not_configured',
      message: 'Add an OpenAI API key to enable realtime voice.'
    }
  }

  const body = await readBody(event)
  const model = config.public.assistantRealtimeModel || 'gpt-realtime-2'

  try {
    const res = await $fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model,
        voice: body?.voice || 'marin',
        instructions: body?.instructions || undefined
      }
    })
    return { session: res, model }
  } catch (e) {
    setResponseStatus(event, e?.response?.status || 502)
    return {
      error: 'openai_error',
      message: e?.data?.error?.message || e.message || 'Realtime session failed'
    }
  }
})
