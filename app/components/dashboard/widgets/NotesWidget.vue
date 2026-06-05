<script setup>
import { watchDebounced } from '@vueuse/core'

const props = defineProps({
  widget: { type: Object, required: true }
})

const key = computed(() => `mango-dashboard-notes:${props.widget.id}`)
const text = ref('')

onMounted(() => {
  try {
    text.value = localStorage.getItem(key.value) || ''
  } catch {}
})

watchDebounced(
  text,
  (v) => {
    try {
      localStorage.setItem(key.value, v)
    } catch {}
  },
  { debounce: 300 }
)
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="border-b px-4 py-3 text-sm font-medium">Notes</div>
    <textarea
      v-model="text"
      placeholder="Jot something down…"
      class="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
    />
  </div>
</template>
