<script setup>
import collections from '@collections'
import { Mango } from '~/helpers/mango.js'
import { DatabaseIcon } from 'lucide-vue-next'

const router = useRouter()
const counts = ref({})
const loading = ref(true)

onMounted(async () => {
  await Promise.all(
    collections.map(async (c) => {
      try {
        const res = await Mango[c.name]({ limit: 1, page: 0 })
        counts.value[c.name] = res.count?.value ?? res.count ?? 0
      } catch {
        counts.value[c.name] = null
      }
    })
  )
  loading.value = false
})
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center gap-1.5 border-b px-4 py-3 text-sm font-medium">
      <DatabaseIcon class="size-4 text-muted-foreground" />
      Collections
    </div>
    <div class="min-h-0 flex-1 overflow-auto p-1.5">
      <button
        v-for="c in collections"
        :key="c.name"
        type="button"
        class="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
        @click="router.push(`/collections/${c.name}`)"
      >
        <span class="truncate">{{ c.titleName }}</span>
        <span
          class="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
        >
          <template v-if="loading">·</template>
          <template v-else>{{ counts[c.name] ?? '—' }}</template>
        </span>
      </button>
    </div>
  </div>
</template>
