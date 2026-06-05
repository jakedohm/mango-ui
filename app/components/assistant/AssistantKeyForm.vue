<script setup>
import { KeyRoundIcon, Loader2Icon, ExternalLinkIcon } from 'lucide-vue-next'

const { savingKey, saveKey } = useAssistant()

const key = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  const res = await saveKey(key.value.trim())
  if (res.ok) {
    key.value = ''
  } else {
    error.value = res.message
  }
}
</script>

<template>
  <div class="m-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
    <div class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-amber-900">
      <KeyRoundIcon class="size-4" />
      Connect OpenAI to enable the assistant
    </div>
    <p class="mb-2 text-xs text-amber-800/90">
      Paste an OpenAI API key. It's saved to your project's
      <code class="font-mono">settings.json</code> on the server and never shown again.
    </p>
    <form class="flex gap-2" @submit.prevent="submit">
      <input
        v-model="key"
        type="password"
        autocomplete="off"
        placeholder="sk-…"
        class="min-w-0 flex-1 rounded-md border bg-background px-2.5 py-1.5 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        type="submit"
        class="inline-flex shrink-0 items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
        :disabled="savingKey || !key.trim()"
      >
        <Loader2Icon v-if="savingKey" class="size-3.5 animate-spin" />
        Save
      </button>
    </form>
    <p v-if="error" class="mt-1.5 text-xs text-destructive">{{ error }}</p>
    <a
      href="https://platform.openai.com/api-keys"
      target="_blank"
      rel="noopener"
      class="mt-2 inline-flex items-center gap-1 text-xs text-amber-800 underline-offset-2 hover:underline"
    >
      Get an API key <ExternalLinkIcon class="size-3" />
    </a>
  </div>
</template>
