<script setup>
import { ClockIcon, ChevronRightIcon, KeyboardIcon } from 'lucide-vue-next'

useHead({
  title: 'Dashboard – Mango'
})
useSeoMeta({
  description:
    'Mango dashboard. Pick up where you left off, view recent pages, and use the command palette to jump to collections or create documents.'
})

const { firstName } = useAuth()
const { recentPages, loadRecentPages } = useRecentPages()

// Ensure recent pages are loaded from localStorage (client-only)
onMounted(() => {
  loadRecentPages()
})

// Don't show "Home" in the list when we're on the homepage
const resumePages = computed(() =>
  recentPages.value.filter((p) => p.path !== '/')
)
</script>

<template>
  <div class="relative min-h-screen flex flex-col p-8 pt-0">
    <PageHeader>
      <template #title>Dashboard</template>
    </PageHeader>
    <div class="max-w-2xl mt-8 space-y-8">
      <!-- Welcome -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">
          Welcome back{{ firstName ? `, ${firstName}` : '' }}
        </h1>
        <p class="mt-1 text-gray-500">
          Pick up where you left off or jump to any collection or document.
        </p>
      </div>

      <!-- ⌘K CTA -->
      <div
        class="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3"
      >
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-md bg-amber-100"
        >
          <KeyboardIcon class="size-4 text-amber-800" />
        </div>
        <div>
          <p class="text-sm font-medium text-amber-900">
            Press
            <kbd
              class="rounded border border-amber-300 bg-white px-1.5 py-0.5 font-mono text-xs"
              >⌘K</kbd
            >
            to open the command palette
          </p>
          <p class="text-xs text-amber-800/80">
            Search, jump to collections, or create new documents.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
