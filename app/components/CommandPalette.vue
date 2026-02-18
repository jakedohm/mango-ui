<script setup>
import { SquareChevronRightIcon } from 'lucide-vue-next'
import { useMagicKeys, whenever } from '@vueuse/core'
import {
  ChevronRightIcon,
  SquarePenIcon,
  SquareUserIcon,
  ClockIcon
} from 'lucide-vue-next'
import collections from '../../mango/config/.collections.json'

const router = useRouter()
const route = useRoute()

const open = ref(false)
const { meta_k } = useMagicKeys()
whenever(meta_k, () => {
  open.value = true
})

// Recent pages tracking via composable
const { recentPages, saveRecentPage, getPageTitle } = useRecentPages()

// Track page visits
watch(
  () => route.fullPath,
  (newPath) => {
    if (newPath) {
      saveRecentPage({
        path: newPath,
        title: getPageTitle(newPath),
        documentTitle: null,
        timestamp: Date.now()
      })
    }
  },
  { immediate: true }
)

function navigateToRecent(page) {
  open.value = false
  router.push(page.path)
}

function createAction(action) {
  return (collectionName) => {
    open.value = false
    action(collectionName)
  }
}
function createDocument(collectionName) {
  router.push(`/collections/${collectionName}/new`)
}
const actions = {
  createCollection: createAction(createDocument)
}
</script>

<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Be a doer">
      <template #icon>
        <SquareChevronRightIcon class="size-4 shrink-0 opacity-50" />
      </template>
    </CommandInput>
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>

      <!-- Recent Pages Section -->
      <CommandGroup v-if="recentPages.length > 0">
        <template #default>
          <div
            class="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5"
          >
            <ClockIcon class="size-3" />
            Recent
          </div>
          <CommandItem
            v-for="page in recentPages"
            :key="page.path"
            :value="`recent-${page.path}`"
            @select="navigateToRecent(page)"
          >
            <SquarePenIcon class="text-gray-600" />
            <div class="flex items-center gap-1">
              <span>{{ page.title }}</span>
              <template v-if="page.documentTitle">
                <ChevronRightIcon class="!h-3 text-gray-400" />
                <span class="text-gray-500">{{ page.documentTitle }}</span>
              </template>
            </div>
          </CommandItem>
        </template>
      </CommandGroup>
      <CommandSeparator v-if="recentPages.length > 0" />

      <CommandGroup heading="Collections">
        <CommandItem
          v-for="collection in collections"
          :key="collection.name"
          @select="actions.createCollection(collection.name)"
          value="create-collection"
        >
          <SquarePenIcon class="text-gray-600" />
          <div class="flex items-center w-full grow">
            {{ collection.titleSingular }}
            <ChevronRightIcon class="!h-3 text-gray-400" />
            Create
          </div>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Account">
        <CommandItem value="profile">
          <SquareUserIcon class="text-gray-600" />
          <span>Profile</span>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>

<style>
@reference "~/assets/css/tailwind.css";

[data-slot='dialog-overlay'] {
  @apply backdrop-blur-xs;
  @apply bg-black/20;
}
</style>
