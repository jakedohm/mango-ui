<script setup>
import { CalendarIcon } from 'lucide-vue-next'
import { useMangoField } from '~/components/MangoForms.js'
import { CalendarDate } from '@internationalized/date'
import { toDate } from 'reka-ui/date'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '~/components/ui/popover'
import { Calendar } from '~/components/ui/calendar'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

const props = defineProps({
  field: Object,
  error: Object
})

const model = defineModel({ type: String })

useMangoField({
  name: props.field.name,
  value: model
})

const open = ref(false)

// Parse initial value from model
const parseModelValue = (value) => {
  if (!value) return { date: null, time: '12:00' }

  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return { date: null, time: '12:00' }

    const dateValue = new CalendarDate(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    )
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return { date: dateValue, time: `${hours}:${minutes}` }
  } catch {
    return { date: null, time: '12:00' }
  }
}

const initial = parseModelValue(model.value)
const selectedDate = ref(initial.date)
const timeValue = ref(initial.time)

// Watch for external model changes
watch(
  () => model.value,
  (newValue) => {
    const parsed = parseModelValue(newValue)
    selectedDate.value = parsed.date
    timeValue.value = parsed.time
  }
)

// Combine date and time into ISO string for model
const updateModel = () => {
  if (!selectedDate.value) {
    model.value = null
    return
  }

  const jsDate = toDate(selectedDate.value)
  const [hours, minutes] = timeValue.value.split(':').map(Number)
  jsDate.setHours(hours || 0, minutes || 0, 0, 0)

  model.value = jsDate.toISOString()
}

watch(selectedDate, updateModel)
watch(timeValue, updateModel)

// Format date for display
const formattedDate = computed(() => {
  if (!selectedDate.value) return null
  const d = toDate(selectedDate.value)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})
</script>

<template>
  <div class="flex items-center gap-3">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          class="justify-start text-left font-normal flex-1"
          :class="{ 'text-muted-foreground': !selectedDate }"
          :aria-invalid="!!error"
        >
          <CalendarIcon class="size-4" />
          {{ formattedDate || 'Pick a date' }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <Calendar
          v-model="selectedDate"
          layout="month-and-year"
          @update:model-value="open = false"
        />
      </PopoverContent>
    </Popover>

    <Input
      v-model="timeValue"
      type="time"
      class="w-auto"
      :aria-invalid="!!error"
    />
  </div>
</template>
