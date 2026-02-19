<script setup>
import { FileIcon, TrashIcon, LoaderCircleIcon } from 'lucide-vue-next'
import { useMangoField } from '~/components/MangoForms.js'
import { api } from '~/helpers/mango.js'

const props = defineProps({
  field: Object,
  error: Object
})

const model = defineModel({ type: Object })

useMangoField({
  name: props.field.name,
  value: model
})

const $fileInput = ref(null)

const getFileUrl = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.url || null
}

const fileUrl = ref(getFileUrl(model.value))
const fileName = ref(model.value?.filename || null)
const fileSize = ref(model.value?.size || null)
const isUploading = ref(false)
const uploadError = ref(null)
const hasFile = computed(() => fileUrl.value !== null)

watch(
  () => model.value,
  (newValue) => {
    const url = getFileUrl(newValue)
    if (url !== fileUrl.value) {
      fileUrl.value = url
      fileName.value = newValue?.filename || null
      fileSize.value = newValue?.size || null
    }
  },
  { deep: true }
)

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function handleChange(event) {
  const files = event.target.files
  const file = files[0]
  if (!file) return

  fileName.value = file.name
  fileSize.value = file.size
  uploadError.value = null
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch(`${api}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    const path = response?.paths?.[0]
    if (path) {
      const uploadedUrl = `${api}${path}`
      fileUrl.value = uploadedUrl
      model.value = uploadedUrl
    } else {
      throw new Error('No path returned from upload')
    }
  } catch (error) {
    console.error('File upload failed:', error)
    uploadError.value = 'Upload failed. Please try again.'
  } finally {
    isUploading.value = false
  }
}

function remove() {
  fileUrl.value = null
  fileName.value = null
  fileSize.value = null
  uploadError.value = null
  model.value = null
  if ($fileInput.value) {
    $fileInput.value.value = ''
  }
}
</script>

<template>
  <div>
    <input hidden ref="$fileInput" type="file" @change="handleChange" />
    <div class="flex flex-col gap-2">
      <div v-if="uploadError" class="text-sm text-red-600 px-2">
        {{ uploadError }}
      </div>

      <div>
        <div
          class="relative z-10 shadow-xs flex flex-col gap-2 p-2 bg-white rounded-md border ring-[3px] ring-transparent transition-shadow"
          :class="error ? 'border-destructive/40 ring-destructive/20 dark:ring-destructive/40' : 'border-input'"
        >
        <template v-if="hasFile">
          <div
            class="group flex items-center gap-3 p-3 bg-gray-50 border border-input rounded-sm"
          >
            <div
              class="flex items-center justify-center size-10 bg-gray-200 rounded"
            >
              <FileIcon class="size-5 text-gray-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">
                {{ fileName || 'File' }}
              </div>
              <div class="text-xs text-gray-500">
                {{ formatFileSize(fileSize) }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div
                v-if="isUploading"
                class="flex items-center gap-2 text-sm text-gray-500"
              >
                <LoaderCircleIcon class="size-4 animate-spin" />
                Uploading...
              </div>
              <Button
                v-else
                @click="remove"
                type="button"
                variant="outline"
                size="icon"
                class="size-8"
              >
                <TrashIcon class="size-4" />
              </Button>
            </div>
          </div>
        </template>
        <div v-else-if="isUploading" class="py-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <LoaderCircleIcon class="size-4 animate-spin" />
          Uploading...
        </div>
        <div v-else class="py-6 text-center text-sm text-gray-400">
          No file yet
        </div>
      </div>

        <div class="mt-[-16px] pt-[16px] rounded-b-md border-t-0 bg-gray-50 border border-input">
          <div class="p-2">
            <Button
              @click="$fileInput.click()"
              size="sm"
              type="button"
              variant="outline"
              :disabled="isUploading || hasFile"
            >
              <FileIcon class="size-4" /> Add file
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
