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
  <div>
    <TipTap v-model="model" :error="error" />

    <!-- For HTML value only -->
    <input
      :name="field.name"
      type="text"
      hidden
      aria-hidden="true"
      v-model="model"
    />
  </div>
</template>
