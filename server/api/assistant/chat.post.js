/*
  Server-side proxy to the OpenAI Chat Completions API.

  The model decides *what* to do (tool calls); the browser executes those tools
  (navigation, Mango reads, write proposals) because that's where the router and
  the user's session cookies live. We only proxy the model turn here so the
  OPENAI_API_KEY never reaches the client.
*/
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiKey = config.openaiApiKey
  if (!apiKey) {
    setResponseStatus(event, 503)
    return {
      error: 'assistant_not_configured',
      message:
        'Set OPENAI_API_KEY in the Mango UI environment to enable the AI assistant.'
    }
  }

  const body = await readBody(event)
  const { messages, tools, model } = body || {}
  if (!Array.isArray(messages)) {
    setResponseStatus(event, 400)
    return { error: 'bad_request', message: 'messages[] required' }
  }

  try {
    const res = await $fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        model: model || config.public.assistantModel || 'gpt-4.1',
        messages,
        tools,
        tool_choice: tools?.length ? 'auto' : undefined,
        temperature: 0.2
      }
    })
    return { message: res?.choices?.[0]?.message, usage: res?.usage }
  } catch (e) {
    setResponseStatus(event, e?.response?.status || 502)
    return {
      error: 'openai_error',
      message: e?.data?.error?.message || e.message || 'OpenAI request failed'
    }
  }
})
