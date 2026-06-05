<script setup>
import {
  SendIcon,
  MicIcon,
  MicOffIcon,
  SquareIcon,
  SparklesIcon,
  Trash2Icon,
  Loader2Icon
} from 'lucide-vue-next'

const { messages, busy, notConfigured, configured, checkConfig, send, reset } =
  useAssistant()
const voice = useRealtimeVoice()

onMounted(() => {
  if (configured.value === null) checkConfig()
})

const input = ref('')
const scroller = ref(null)

async function submit() {
  const text = input.value
  input.value = ''
  await send(text)
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function toggleVoice() {
  if (voice.status.value === 'live' || voice.status.value === 'connecting') {
    voice.stop()
  } else {
    voice.start()
  }
}

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  }
)
</script>

<template>
  <div class="flex h-full flex-col bg-card">
    <!-- Header -->
    <div class="flex items-center justify-between border-b px-3 py-2">
      <div class="flex items-center gap-1.5 text-sm font-medium">
        <SparklesIcon class="size-4 text-amber-500" />
        Mango assistant
        <span
          v-if="voice.status.value === 'live'"
          class="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
        >
          <span class="size-1.5 animate-pulse rounded-full bg-emerald-500" /> live
        </span>
      </div>
      <button
        type="button"
        class="rounded p-1 text-muted-foreground hover:bg-muted"
        title="Clear conversation"
        @click="reset"
      >
        <Trash2Icon class="size-3.5" />
      </button>
    </div>

    <!-- Key setup (shown until a key is configured) -->
    <AssistantKeyForm v-if="notConfigured" />

    <!-- Messages -->
    <div ref="scroller" class="min-h-0 flex-1 space-y-3 overflow-auto p-3">
      <div v-if="!messages.length" class="px-1 py-6 text-center text-sm text-muted-foreground">
        <p>Ask me to find documents, navigate, or make edits.</p>
        <p class="mt-2 text-xs">
          "Find draft posts" · "Open the latest author" · "Set this post's status to published"
        </p>
      </div>

      <template v-for="m in messages" :key="m.id">
        <ApprovalCard v-if="m.role === 'approval'" :approval-id="m.approvalId" />
        <div
          v-else-if="m.role === 'user'"
          class="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-foreground px-3 py-1.5 text-sm text-background"
        >
          {{ m.content }}
        </div>
        <div
          v-else-if="m.role === 'assistant'"
          class="w-fit max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-1.5 text-sm"
        >
          {{ m.content }}
        </div>
        <p v-else-if="m.role === 'note'" class="text-center text-xs italic text-muted-foreground">
          {{ m.content }}
        </p>
      </template>

      <p v-if="busy" class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2Icon class="size-3.5 animate-spin" /> Thinking…
      </p>
    </div>

    <p v-if="voice.error.value" class="border-t bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
      {{ voice.error.value }}
    </p>

    <!-- Composer -->
    <div class="flex items-end gap-2 border-t p-2">
      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors"
        :class="voice.status.value === 'live'
          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
          : 'hover:bg-muted'"
        :title="voice.status.value === 'live' ? 'Stop voice' : 'Start voice'"
        @click="toggleVoice"
      >
        <Loader2Icon v-if="voice.status.value === 'connecting'" class="size-4 animate-spin" />
        <SquareIcon v-else-if="voice.status.value === 'live'" class="size-4" />
        <MicIcon v-else class="size-4" />
      </button>
      <button
        v-if="voice.status.value === 'live'"
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-md border hover:bg-muted"
        :title="voice.muted.value ? 'Unmute' : 'Mute'"
        @click="voice.toggleMute"
      >
        <MicOffIcon v-if="voice.muted.value" class="size-4 text-destructive" />
        <MicIcon v-else class="size-4" />
      </button>

      <textarea
        v-model="input"
        rows="1"
        placeholder="Message Mango…"
        class="max-h-32 min-h-9 flex-1 resize-none rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        @keydown="onKeydown"
      />
      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40"
        :disabled="busy || !input.trim()"
        @click="submit"
      >
        <SendIcon class="size-4" />
      </button>
    </div>
  </div>
</template>
