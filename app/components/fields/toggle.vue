<script setup>
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object,
  error: Object
})

const model = defineModel({ type: Boolean, default: false })

useMangoField({
  name: props.field.name,
  value: model
})
</script>

<template>
  <div
    class="flex items-center gap-3 px-3 py-3 bg-gray-50 border rounded-sm shadow-xs ring-[3px] ring-transparent transition-shadow"
    :class="error ? 'border-destructive/40 ring-destructive/20 dark:ring-destructive/40' : 'border-input'"
  >
    <Switch v-model="model" class="data-[state=checked]:bg-emerald-600" :aria-invalid="!!error" />
  </div>
</template>
