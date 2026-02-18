<script setup>
import { ImageIcon, TrashIcon, LoaderCircleIcon } from 'lucide-vue-next'
import { useMangoField } from '~/components/MangoForms.js'
import { api } from '~/helpers/mango.js'

const props = defineProps({
  field: Object
})

const model = defineModel({ type: Object })

useMangoField({
  name: props.field.name,
  value: model
})

const $fileInput = ref(null)

// Handle both string URLs (temp uploads) and object format { url, width, height } (stored images)
const getImageUrl = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.url || null
}

const imagePreview = ref(getImageUrl(model.value))
const fileName = ref(null)
const fileSize = ref(null)
const isUploading = ref(false)
const uploadError = ref(null)
const hasImage = computed(() => imagePreview.value !== null)

// Watch for external model changes (e.g., form reset or data load)
watch(
  () => model.value,
  (newValue) => {
    const url = getImageUrl(newValue)
    if (url !== imagePreview.value) {
      imagePreview.value = url
    }
  },
  { deep: true }
)

// Format file size for display
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function handleChange(event) {
  const files = event.target.files
  const file = files[0]
  if (!file) return

  // Show local preview immediately
  imagePreview.value = URL.createObjectURL(file)
  fileName.value = file.name
  fileSize.value = formatFileSize(file.size)
  uploadError.value = null
  isUploading.value = true

  try {
    // Upload to Mango's temp storage
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch(`${api}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    // Get the uploaded file path and construct full URL
    const path = response?.paths?.[0]
    if (path) {
      const uploadedUrl = `${api}${path}`
      // Update preview to use the uploaded URL
      imagePreview.value = uploadedUrl
      // Store the URL in the model - Mango will process this on document save
      model.value = uploadedUrl
    } else {
      throw new Error('No path returned from upload')
    }
  } catch (error) {
    console.error('Image upload failed:', error)
    uploadError.value = 'Upload failed. Please try again.'
    // Keep the local preview but mark as failed
  } finally {
    isUploading.value = false
  }
}

function remove() {
  imagePreview.value = null
  fileName.value = null
  fileSize.value = null
  uploadError.value = null
  model.value = null
  // Reset the file input
  if ($fileInput.value) {
    $fileInput.value.value = ''
  }
}
</script>

<template>
  <div>
    <input
      hidden
      ref="$fileInput"
      type="file"
      accept="image/*"
      @change="handleChange"
    />
    <div class="flex flex-col gap-2 shadow-xs rounded-md">
      <!-- Error message -->
      <div v-if="uploadError" class="text-sm text-red-600 px-2">
        {{ uploadError }}
      </div>

      <div>
        <div
          class="relative z-10 grid grid-cols-3 gap-2 p-2 bg-white rounded-md border border-input"
        >
          <template v-if="hasImage">
            <Item
              class="group p-2.5 relative z-10 bg-gray-50 border border-input rounded-sm -m-[1px]"
              variant="outline"
              size="sm"
              asChild
              role="listitem"
            >
              <div>
                <ItemHeader class="relative">
                  <img
                    :src="imagePreview"
                    class="max-w-full rounded-sm object-cover aspect-[14/9]"
                  />
                  <!-- Upload overlay -->
                  <div
                    v-if="isUploading"
                    class="absolute inset-0 bg-black/50 rounded-sm flex items-center justify-center"
                  >
                    <LoaderCircleIcon class="size-6 text-white animate-spin" />
                  </div>
                </ItemHeader>
                <ItemContent>
                  <ItemTitle class="line-clamp-1">{{
                    fileName || 'Image'
                  }}</ItemTitle>
                </ItemContent>
                <ItemContent class="relative flex-none text-center">
                  <ItemDescription
                    class="group-hover/item:opacity-0 transition-opacity text-xs"
                    >{{ fileSize || '' }}</ItemDescription
                  >
                  <Button
                    @click="remove"
                    type="button"
                    variant="outline"
                    size="icon"
                    class="size-7 opacity-0 group-hover/item:opacity-100 absolute top-1/2 right-0 -translate-y-1/2 transition-opacity"
                    :disabled="isUploading"
                  >
                    <TrashIcon class="size-3" />
                  </Button>
                </ItemContent>
              </div>
            </Item>
          </template>
          <div
            v-else-if="isUploading"
            class="col-span-3 py-6 flex items-center justify-center gap-2 text-sm text-gray-500"
          >
            <LoaderCircleIcon class="size-4 animate-spin" />
            Uploading...
          </div>
          <div v-else class="col-span-3 py-6 text-center text-sm text-gray-400">
            No image yet
          </div>
        </div>

        <div
          class="mt-[-16px] pt-[16px] rounded-b-md border-t-0 bg-gray-50 border border-input"
        >
          <div class="p-2">
            <Button
              @click="$fileInput.click()"
              size="sm"
              type="button"
              variant="outline"
              :disabled="isUploading || hasImage"
            >
              <ImageIcon /> Add image
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
