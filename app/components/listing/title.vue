<script setup>
const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  document: {
    type: Object,
    required: true
  },
  collection: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <NuxtLink
    :to="`/collections/${collection.name}/${document.id}`"
    class="font-medium text-sm text-gray-600 group-hover:text-amber-700 group-focus-within:text-amber-700 transition-colors outline-none"
  >
    {{ value }}
  </NuxtLink>
</template>
