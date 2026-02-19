<script setup>
import collections from '../../mango/config/.collections.json'
import { Mango } from '../helpers/mango.js'
import { ListingFieldRenderer } from '~/components/listing/ListingFieldRenderer.js'
import {
  PlusIcon,
  TrashIcon,
  FunnelPlusIcon,
  SearchIcon
} from 'lucide-vue-next'
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
const deleteDialogOpen = ref(false)
const itemToDelete = ref(null)

async function getDocuments() {
  const hasTitle = collection.fields.some((field) => field.name === 'title')
  return Mango[collection.name]({
    sort: { created: -1 },
    ...(searchInput.value && hasTitle
      ? { title: { $regex: searchInput.value, $options: 'i' } }
      : {})
  })
}

let { data } = await getDocuments()

async function search() {
  const { data: _data } = await getDocuments()
  data.value = _data.value
}

function confirmDelete(item) {
  itemToDelete.value = item
  deleteDialogOpen.value = true
}

async function deleteItem() {
  if (!itemToDelete.value) return
  await Mango[collection.name].delete(itemToDelete.value.id)
  itemToDelete.value = null

  toast.success('Document deleted successfully')
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <InputGroup
                  class="w-60 focus-within:w-80 transition-[width] opacity-50"
                >
                  <InputGroupInput
                    placeholder="Search..."
                    v-model="searchInput"
                    @keydown.enter="search"
                    :disabled="true"
                  />
                  <InputGroupAddon @click="search">
                    <SearchIcon />
                  </InputGroupAddon>
                </InputGroup>
              </TooltipTrigger>
              <TooltipContent> Coming soon... </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button asChild class="bg-emerald-600 hover:bg-emerald-800 -my-2">
            <NuxtLink :to="`/collections/${collection.name}/new`">
              <PlusIcon class="size-3" />
              New
            </NuxtLink>
          </Button>
        </div>
      </template>
    </PageHeader>

    <!-- <pre>{{ collection }}</pre> -->

    <div
      class="text-card-foreground flex flex-col rounded-md border shadow-xs overflow-hidden"
    >
      <div class="scroll-container relative overflow-x-auto overflow-y-hidden">
        <!-- Scroll shadows (inside scroll-container for scroll-state to work) -->
        <div class="scroll-shadow-left" />
        <div class="scroll-shadow-right" />
        <div
          class="grid"
          :style="`grid-template-columns: repeat(${displayFields.length}, minmax(min-content, 1fr));`"
        >
          <div
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
            class="relative group col-span-full grid gap-8 grid-cols-subgrid px-4 pt-3 pb-3.5 text-gray-500 [&:is(:hover,:focus-within)]:border-amber-200 border-l-2 border-transparent transition-colors text-sm w-screen *:whitespace-nowrap *:overflow-hidden *:truncate *:max-w-[250px]"
            :class="{
              'bg-gray-50/50': i % 2 === 1
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
              @click="confirmDelete(link)"
              size="icon"
              variant="outline"
              class="z-10 size-7 fixed right-10 mt-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all hover:border-red-400 hover:text-red-700"
            >
              <span class="sr-only">Delete</span>
              <TrashIcon class="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete document?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{{ itemToDelete?.title }}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700"
            @click="deleteItem"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
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
