<script setup>
import { KeyboardIcon, SparklesIcon } from 'lucide-vue-next'

const { firstName } = useAuth()
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <div class="flex h-full flex-col justify-center gap-2 p-5">
    <div class="flex items-center gap-2 text-xs font-medium text-amber-600">
      <SparklesIcon class="size-3.5" />
      Mango dashboard
    </div>
    <h1 class="text-2xl font-semibold tracking-tight">
      {{ greeting }}{{ firstName ? `, ${firstName}` : '' }}
    </h1>
    <p class="text-sm text-muted-foreground">
      Drag, drop, and resize anything here. Press
      <kbd class="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>
      to jump anywhere, or ask the assistant to do it for you.
    </p>
  </div>
</template>
