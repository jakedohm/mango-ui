<script setup>
import { Mango } from '../helpers/mango.js'
import collections from '../../../mango/config/.collections.json'
import { CalendarClockIcon, SaveIcon } from 'lucide-vue-next'
import { useForm } from '~/components/MangoForms.js'

const { collection: collectionName, id } = useRoute().params
const router = useRouter()

const newDocument = id === 'new'

const collection = collections.find((c) => c.name === collectionName)
const fields = collection.fields
const showFields = fields
  .filter((field) => !field.global && !field.hidden)
  .map((field) => {
    if (field.name === 'password') {
      // TODO: remove this once we have a password reset page	🔒
      return {
        ...field,
        instructions:
          'Fill out the field and save document to reset your password'
      }
    } else if (field.name === 'titleReverse') {
      return {
        ...field,
        instructions: 'This field is computed from the title field'
      }
    }
    return field
  })

// Get document data
const document = ref({})
const { data } = await Mango[collectionName]({ id })

// Sync data to document ref
watch(
  data,
  (newData) => {
    if (newData) {
      Object.assign(document.value, newData)
    }
  },
  { immediate: true, deep: true }
)

const updatedHuman = computed(() =>
  !newDocument ? formatUpdatedDateTime(document.value.updated) : null
)
const title = computed(() =>
  newDocument ? 'New Document' : document.value?.title || 'Edit'
)

const seoTitle = computed(() => {
  const primary = newDocument
    ? `New ${collection?.titleSingular ?? collectionName}`
    : document.value?.title ||
      document.value?.email ||
      document.value?.name ||
      'Edit'
  const secondary = `${collection?.titleName ?? collectionName} | Mango`
  return `${primary} – ${secondary}`
})
const seoDescription = computed(() => {
  const coll = collection?.titleName ?? collectionName
  return newDocument
    ? `Create a new ${collection?.titleSingular ?? collectionName} in ${coll} with Mango.`
    : `Edit this ${collection?.titleSingular ?? collectionName} in ${coll} with Mango.`
})
useHead({
  title: () => seoTitle.value
})
useSeoMeta({
  description: () => seoDescription.value
})

const { status, valid, actions } = useForm(id, {
  hooks: {
    onSuccess: (doc) => {
      if (newDocument) {
        router.push(`/collections/${collectionName}/${doc.id}`)
      }
    }
  }
})

// Update recent pages with document title
const { updateRecentPageTitle } = useRecentPages()

// Update recent pages when data loads
watch(
  data,
  (doc) => {
    if (newDocument || !doc) return
    const documentTitle = doc.title || doc.name || doc.email || doc.slug
    if (documentTitle) {
      updateRecentPageTitle(
        `/collections/${collectionName}/${id}`,
        collection?.titleSingular || collectionName,
        documentTitle
      )
    }
  },
  { immediate: true }
)

// Handle CMD + S keypress to save
function handleKeydown(event) {
  if (
    (navigator.platform.includes('Mac') ? event.metaKey : event.ctrlKey) &&
    event.key === 's'
  ) {
    event.preventDefault()
    actions.value.submit()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function formatUpdatedDateTime(updatedDate) {
  const updatedToday =
    new Date(updatedDate).toDateString() === new Date().toDateString()

  if (updatedToday) {
    const time = new Date(updatedDate).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric'
    })
    return `Today at ${time}`
  } else {
    return new Date(updatedDate).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
}
</script>

<template>
  <div>
    <div class="px-8 sticky z-30 top-0 bg-white/20 backdrop-blur">
      <PageHeader>
        <template #title>
          <NuxtLink
            :to="`/collections/${collectionName}`"
            class="block mb-0.5 text-xs uppercase tracking-[0.06em] text-gray-500"
            >{{ collection.humanName }}</NuxtLink
          >
          <span>
            {{ title }}
          </span>
        </template>

        <template #right>
          <div class="flex gap-6">
            <div
              v-if="!newDocument"
              class="flex items-center gap-1.5 text-gray-500"
            >
              <!-- <CalendarClockIcon class="size-4" /> -->
              <div>
                <p
                  class="font-semibold text-gray-600 text-xs uppercase tracking-wider mb-1"
                >
                  Last update
                </p>
                <p class="-mt-1 text-sm">{{ updatedHuman }}</p>
              </div>
            </div>

            <Button
              @click="actions.submit"
              class="bg-emerald-600 hover:bg-emerald-800"
              :disabled="status === 'pending' ? '' : false"
            >
              <Spinner
                v-if="status === 'pending'"
                class="animate-spin size-4"
              />
              <SaveIcon v-else class="size-4" />
              <span>Save</span>
            </Button>
          </div>
        </template>
      </PageHeader>
    </div>

    <div class="p-8 pt-6 pb-32">
      <MangoForm
        #default="{ errors }"
        :collection="collectionName"
        :id="id"
        class="grid grid-cols-[2fr_1fr] gap-y-6 gap-x-8"
      >
        <template v-for="field in showFields" :key="field.name">
          <MangoField
            :level="1"
            :field="field"
            v-model="document[field.name]"
            :name="field.name"
            :error="errors?.fields?.[field.name]"
          />
        </template>
      </MangoForm>
    </div>
  </div>
</template>

<style scoped>
:deep(:is(input, textarea, select)) {
  background-color: #fff;
}
</style>
