<script setup>
const props = defineProps({
  value: {
    type: [String, Date],
    default: null
  }
})

const displayValue = computed(() => {
  if (!props.value) return '—'

  const date = new Date(props.value)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})
</script>

<template>
  <div>{{ displayValue }}</div>
</template>
