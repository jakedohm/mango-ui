<script setup>
import collections from '../../mango/config/.collections.json'
import { Mango } from '../helpers/mango.js'
import { ListingFieldRenderer } from '~/components/listing/ListingFieldRenderer.js'
import { PlusIcon, TrashIcon, SearchIcon, DownloadIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { params } = useRoute()
const collection = collections.find((c) => c.name === params.collection)

useHead({
  title: () => `${collection?.titleName ?? params.collection} – Mango CMS`
})
useSeoMeta({
  description: () =>
    `View and manage ${collection?.titleName ?? params.collection} in Mango CMS. Browse, create, and edit documents.`
})

const defaultFields = ['title', 'author', 'slug', 'created'].map((field) =>
  collection.fields.find((f) => f.name === field)
)

const displayFields = defaultFields.filter((field) => field !== undefined)

const searchInput = ref('')
const confirmingDeleteId = ref(null)

const limit = useCookie('mango-collection-limit', { default: () => 10 })
const page = ref(1)
const limitOptions = [10, 25, 50, 100]

const limitStr = computed({
  get: () => String(limit.value),
  set: (v) => {
    limit.value = Number(v)
    page.value = 1
  }
})

const { data, count, status } = await Mango[collection.name]({
  sort: { created: -1 },
  search: () => ({ [searchInput.value]: null }),
  limit: () => limit.value,
  page: () => page.value - 1,
  debounce: 225,
  wait: 250
})

watch(searchInput, () => {
  page.value = 1
})

function handleDelete(item, event) {
  if (confirmingDeleteId.value === item.id) {
    Mango[collection.name].delete(item.id)
    confirmingDeleteId.value = null
    toast.success('Document deleted successfully')
  } else {
    confirmingDeleteId.value = item.id
    nextTick(() => event.target.closest('button')?.focus())
  }
}

function cancelDelete() {
  confirmingDeleteId.value = null
}

function titleCase(str) {
  return str.replace(/\b\w/g, (l) => l.toUpperCase())
}
</script>

<template>
  <div class="relative min-h-screen flex flex-col p-8 pt-0">
    <PageHeader class="border-b-0">
      <template #title>
        <span
          class="block mb-0.5 text-xs uppercase tracking-[0.06em] text-gray-500"
          >Collections</span
        >
        <span>
          {{ collection.titleName }}
        </span>
      </template>
      <template #right>
        <div class="flex items-center gap-4">
          <InputGroup class="w-60 focus-within:w-80 transition-[width]">
            <InputGroupInput placeholder="Search..." v-model="searchInput" />
            <InputGroupAddon>
              <Spinner class="text-amber-600" v-if="status === 'pending'" />
              <SearchIcon v-else />
            </InputGroupAddon>
          </InputGroup>
          <Button asChild class="bg-emerald-600 hover:bg-emerald-800 -my-2">
            <NuxtLink :to="`/collections/${collection.name}/new`">
              <PlusIcon class="size-3" />
              New
            </NuxtLink>
          </Button>
        </div>
      </template>
    </PageHeader>

    <div
      class="text-card-foreground flex flex-col rounded-md border shadow-xs overflow-hidden"
    >
      <div class="scroll-container relative overflow-x-auto overflow-y-hidden">
        <!-- Scroll shadows (inside scroll-container for scroll-state to work) -->
        <div class="scroll-shadow-left" />
        <div class="scroll-shadow-right" />

        <!-- Table Rows -->
        <TransitionGroup
          tag="div"
          name="table-row"
          class="grid"
          :style="`grid-template-columns: repeat(${displayFields.length}, minmax(min-content, 1fr));`"
        >
          <!-- Table Header -->
          <div
            key="header"
            class="relative bg-gray-50 col-span-full grid gap-8 grid-cols-subgrid py-3.5 border-b border-gray-200 text-gray-700 px-4"
          >
            <div
              v-for="field in displayFields"
              :key="field.key"
              class="font-medium text-sm"
            >
              {{ field.displayName || titleCase(field.humanName) }}
            </div>
          </div>

          <div
            v-for="(link, i) in data"
            :key="link.id"
            class="table-row-item relative group col-span-full grid gap-8 grid-cols-subgrid px-4 pt-3 pb-3.5 text-gray-500 [&:is(:hover,:focus-within)]:border-amber-200 border-l-2 border-transparent transition-colors text-sm w-screen *:whitespace-nowrap *:overflow-hidden *:truncate *:max-w-[250px]"
            :class="{
              'bg-gray-50/80': i % 2 === 1,
              'opacity-50': status === 'pending'
            }"
          >
            <ListingFieldRenderer
              v-for="field in displayFields"
              :key="field.name"
              :field="field"
              :value="link[field.name]"
              :document="link"
              :collection="collection"
            />

            <Button
              @click="handleDelete(link, $event)"
              @blur="cancelDelete"
              @keydown.escape="cancelDelete"
              size="icon"
              variant="outline"
              class="z-10 h-7 fixed right-10 mt-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all"
              :class="
                confirmingDeleteId === link.id
                  ? 'opacity-100 w-auto px-2 bg-red-600 !border-red-600 text-white hover:bg-red-700 hover:!border-red-700 hover:text-white !ring-2 !ring-red-200 !ring-offset-0'
                  : 'w-7 hover:border-red-400 hover:text-red-700'
              "
            >
              <span v-if="confirmingDeleteId === link.id">Confirm</span>
              <span v-else class="sr-only">Delete</span>
              <TrashIcon class="size-3" />
            </Button>
          </div>
        </TransitionGroup>
      </div>

      <div
        class="flex flex-nowrap items-center gap-3 border-t border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-600"
      >
        <div class="flex shrink-0 items-center gap-2">
          <Select v-model="limitStr">
            <SelectTrigger class="h-8 w-[4.5rem]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="n in limitOptions" :key="n" :value="String(n)">
                {{ n }}
              </SelectItem>
            </SelectContent>
          </Select>
          <span class="text-gray-500">per page</span>
        </div>
        <Pagination
          v-model:page="page"
          :total="count"
          :items-per-page="limit"
          :sibling-count="1"
          :show-edges="true"
          class="flex-1 justify-center"
        >
          <PaginationContent v-slot="{ items }" class="gap-1">
            <PaginationPrevious class="h-8" />
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
                class="h-8 min-w-8"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :index="index" />
            </template>
            <PaginationNext class="h-8" />
          </PaginationContent>
        </Pagination>
        <Button
          disabled
          variant="outline"
          class="shrink-0 h-8 gap-1.5 text-gray-600"
        >
          <DownloadIcon class="size-3.5" />
          Export
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Table row transitions */
.table-row-item {
  overflow: hidden;
}

.table-row-enter-active,
.table-row-leave-active {
  transition:
    opacity 0.25s ease,
    max-height 0.25s ease,
    padding 0.25s ease,
    transform 0.25s ease;
}

.table-row-enter-from,
.table-row-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  transform: translateX(-8px);
}

.table-row-enter-to,
.table-row-leave-from {
  max-height: 60px;
}

.table-row-move {
  transition: transform 0.3s ease;
}

.scroll-container {
  container-type: scroll-state;
}

.scroll-shadow-left,
.scroll-shadow-right {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 0;
  height: 0;
  pointer-events: none;
}

.scroll-shadow-left {
  float: left;
  left: 0;
}

.scroll-shadow-right {
  left: 100%;
}

.scroll-shadow-left::after,
.scroll-shadow-right::after {
  content: '';
  position: absolute;
  top: 0;
  height: 100vh;
  width: 32px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.scroll-shadow-left::after {
  left: 0;
  background: linear-gradient(to left, transparent, rgba(255, 255, 255, 1));
}

.scroll-shadow-right::after {
  right: 0;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 1));
}

@container scroll-state(scrollable: left) {
  .scroll-shadow-left::after {
    opacity: 1;
  }
}

@container scroll-state(scrollable: right) {
  .scroll-shadow-right::after {
    opacity: 1;
  }
}
</style>
