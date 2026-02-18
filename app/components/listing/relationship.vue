<script setup>
const props = defineProps({
  value: {
    type: [Object, Array, String],
    default: null
  }
})

function getTitle(item) {
  if (!item) return null
  if (typeof item === 'string') return item
  return item.title ?? item.name ?? null
}

const displayValue = computed(() => {
  if (!props.value) return '—'

  if (Array.isArray(props.value)) {
    const titles = props.value.map(getTitle).filter(Boolean)
    return titles.length ? titles.join(', ') : '—'
  }

  return getTitle(props.value) ?? '—'
})
</script>

<template>
  <div>{{ displayValue }}</div>
</template>
