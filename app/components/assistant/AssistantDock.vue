<script setup>
import { useMagicKeys, whenever } from '@vueuse/core'
import { SparklesIcon, XIcon } from 'lucide-vue-next'

const open = useState('assistant-dock-open', () => false)

const { meta_j } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.metaKey && e.key === 'j' && e.type === 'keydown') e.preventDefault()
  }
})
whenever(meta_j, () => {
  open.value = !open.value
})
</script>

<template>
  <div>
    <!-- Floating toggle -->
    <button
      type="button"
      class="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105"
      :title="open ? 'Close assistant (⌘J)' : 'Open assistant (⌘J)'"
      @click="open = !open"
    >
      <component :is="open ? XIcon : SparklesIcon" class="size-5" />
    </button>

    <!-- Docked panel -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-y-3 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="translate-y-3 opacity-0"
    >
      <div
        v-if="open"
        class="fixed bottom-20 right-5 z-40 h-[min(620px,75vh)] w-[min(400px,calc(100vw-2.5rem))] overflow-hidden rounded-xl border bg-card shadow-2xl"
      >
        <AssistantPanel />
      </div>
    </Transition>
  </div>
</template>
