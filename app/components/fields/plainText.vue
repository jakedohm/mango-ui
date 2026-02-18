<script setup>
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object
})

const model = defineModel({ type: String })

useMangoField({
  name: props.field.name,
  value: model
})
</script>

<template>
  <Input v-model="model" :name="field.name" />
</template>
