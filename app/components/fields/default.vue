<script setup>
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object
})

const model = defineModel({ type: [String, Number, Object, Array] })

useMangoField({
  name: props.field.name,
  value: model
})
</script>

<template>
  <div class="p-2 border-2 border-red-200 rounded-md">
    Field: {{ field.name }}, Type: {{ field.instanceOf ?? 'undefined' }}
    <Input v-model="model" :name="field.name" />
  </div>
</template>
