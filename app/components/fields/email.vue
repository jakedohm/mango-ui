<script setup>
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object,
  error: Object
})

const model = defineModel({ type: String })

useMangoField({
  name: props.field.name,
  value: model
})
</script>

<template>
  <Input type="email" v-model="model" :name="field.name" :aria-invalid="!!error" />
</template>
