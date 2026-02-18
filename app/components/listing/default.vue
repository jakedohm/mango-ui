<script setup>
const props = defineProps({
  value: {
    type: [String, Number, Boolean, Array, Object],
    default: null
  }
})

const displayValue = computed(() => {
  const value = props.value

  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, ' ').trim()
  }

  return value
})
</script>

<template>
  <div>{{ displayValue }}</div>
</template>
