<script setup>
import { useMangoField } from '~/components/MangoForms.js'
import { EyeIcon } from 'lucide-vue-next'

const props = defineProps({
  field: Object,
  error: Object
})

const model = defineModel({ type: String })

const localModel = computed({
  get() {
    try {
      return JSON.stringify(JSON.parse(model.value), null, 2)
    } catch (error) {
      return model.value
    }
  },
  set(value) {
    try {
      model.value = JSON.parse(value)
    } catch (error) {
      model.value = value
    }
  }
})

const showAll = ref(false)

useMangoField({
  name: props.field.name,
  value: model
})
</script>

<template>
  <div
    class="relative p-2 border shadow-xs rounded-md bg-white ring-[3px] ring-transparent transition-shadow"
    :class="error ? 'border-destructive/40 ring-destructive/20 dark:ring-destructive/40' : 'border-input'"
  >
    <pre
      class="text-xs max-w-full break-all whitespace-pre-wrap overflow-y-hidden transition-[height]"
      :class="[showAll ? '!h-auto' : 'h-54 -mb-2']"
      >{{ localModel }}</pre
    >

    <div class="flex justify-end absolute bottom-0 right-0 w-full px-2 py-2">
      <div
        v-if="!showAll"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-md bg-gradient-to-t from-white to-transparent"
        aria-hidden="true"
      ></div>
      <Button
        class="relative z-10"
        type="button"
        variant="outline"
        size="sm"
        @click="showAll = !showAll"
      >
        <EyeIcon class="size-4" />
        {{ showAll ? 'Collapse' : 'Show All' }}
      </Button>
    </div>
  </div>
</template>
