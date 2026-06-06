<script setup>
import { ClockIcon, ChevronRightIcon } from 'lucide-vue-next'

const router = useRouter()
const { recentPages, loadRecentPages } = useRecentPages()

onMounted(() => loadRecentPages())

const pages = computed(() =>
  recentPages.value.filter((p) => p.path !== '/').slice(0, 12)
)
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center gap-1.5 border-b px-4 py-3 text-sm font-medium">
      <ClockIcon class="size-4 text-muted-foreground" />
      Recent
    </div>
    <div class="min-h-0 flex-1 overflow-auto p-1.5">
      <p v-if="!pages.length" class="px-2.5 py-2 text-xs text-muted-foreground">
        Pages you visit will show up here.
      </p>
      <button
        v-for="page in pages"
        :key="page.path"
        type="button"
        class="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
        @click="router.push(page.path)"
      >
        <span class="truncate">{{ page.title }}</span>
        <template v-if="page.documentTitle">
          <ChevronRightIcon class="size-3 shrink-0 text-muted-foreground" />
          <span class="truncate text-muted-foreground">{{ page.documentTitle }}</span>
        </template>
      </button>
    </div>
  </div>
</template>
