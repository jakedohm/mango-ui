/*
  Lightweight status check for the assistant UI. Reports whether an OpenAI key
  is configured (and where it came from) WITHOUT ever returning the key itself,
  so the panel can show the key-entry form up front when it's missing.
*/
export default defineEventHandler(() => {
  const { source } = resolveOpenAiKey()
  const config = useRuntimeConfig()
  return {
    configured: !!source,
    source, // 'settings' | 'env' | null
    realtimeModel: config.public.assistantRealtimeModel,
    model: config.public.assistantModel
  }
})
