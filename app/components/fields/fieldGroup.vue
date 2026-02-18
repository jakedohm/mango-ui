<script setup>
import FieldGroupBlock from './_group.vue'
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object
})

const model = defineModel({ type: Object })

useMangoField({
  name: props.field.name,
  value: model
})

function getDefaultValue() {
  return Object.fromEntries(
    props.field.fields.map((subfield) => [subfield.name, ''])
  )
}

// Local reactive state that's always defined
const localModel = ref(model.value ?? getDefaultValue())

// Sync parent -> local (when parent data loads)
watch(() => model.value, (newVal) => {
  if (newVal != null) {
    localModel.value = newVal
  }
}, { immediate: false })

// Sync local -> parent (when user edits)
watch(localModel, (newVal) => {
  model.value = newVal
}, { deep: true })
</script>

<template>
  <FieldGroupBlock :field="field" :repeatable="false" v-model="localModel" />
</template>
