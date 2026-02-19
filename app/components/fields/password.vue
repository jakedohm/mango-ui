<script setup>
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object,
  error: Object
})

// to keep from falling through to child
const __model = defineModel({ type: String })

const value = ref(null)

watch(value, (newValue) => {
  if (newValue === null) return
  useMangoField({
    name: props.field.name,
    value
  })
})
</script>

<template>
  <Input type="password" v-model="value" :name="field.name" :aria-invalid="!!error" />
</template>
