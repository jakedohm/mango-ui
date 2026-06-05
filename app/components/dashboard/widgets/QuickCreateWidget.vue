<script setup>
import collections from '@collections'
import { PlusIcon } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="border-b px-4 py-3 text-sm font-medium">Quick create</div>
    <div class="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-1.5 overflow-auto p-2">
      <button
        v-for="c in collections"
        :key="c.name"
        type="button"
        class="flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-solid hover:bg-muted hover:text-foreground"
        @click="router.push(`/collections/${c.name}/new`)"
      >
        <PlusIcon class="size-3.5 shrink-0" />
        <span class="truncate">{{ c.titleSingular }}</span>
      </button>
    </div>
  </div>
</template>
