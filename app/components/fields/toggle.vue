<script setup>
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object
})

const model = defineModel({ type: Boolean, default: false })

useMangoField({
  name: props.field.name,
  value: model
})
</script>

<template>
  <div class="flex items-center gap-3 px-3 py-3 bg-gray-50 border border-input rounded-sm shadow-xs">
    <Switch v-model="model" class="data-[state=checked]:bg-emerald-600" />
  </div>
</template>
