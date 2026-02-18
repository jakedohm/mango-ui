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
  <Select v-model="model" :multiple="!field.single">
    <SelectTrigger>
      <SelectValue placeholder="Select an option" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="(option, i) in field.options"
        :key="i"
        :value="option"
        >{{ option }}</SelectItem
      >
    </SelectContent>
  </Select>

  <!-- Custom implementation of the native select field to support multiple selection -->
  <select
    aria-hidden="true"
    tabindex="-1"
    hidden
    :name="field.name"
    :multiple="!field.single"
    v-model="model"
  >
    <option v-for="(option, i) in field.options" :key="i" :value="option">
      {{ option }}
    </option>
  </select>
</template>
