<script setup>
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-vue-next'
import { Mango } from '~/helpers/mango'
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object
})

const model = defineModel({ type: [Array, String] })

const { data: documents } = await Mango[props.field.relationship]()
const open = ref(false)

// Initialize selected values
const getInitialValue = () => {
  if (!model.value) return []
  if (Array.isArray(model.value)) {
    return model.value.map((v) => v?.id ?? v)
  }
  return [model.value]
}
const selected = ref(getInitialValue())

useMangoField({
  name: props.field.name,
  value: selected
})

const isSelected = (id) => selected.value.includes(id)

const toggleSelection = (id) => {
  if (props.field.single) {
    selected.value = [id]
    open.value = false
  } else {
    const idx = selected.value.indexOf(id)
    if (idx === -1) {
      selected.value.push(id)
    } else {
      selected.value.splice(idx, 1)
    }
  }
}

const displayText = computed(() => {
  if (!selected.value.length) return 'Select...'
  return selected.value
    .map((id) => documents.value.find((d) => d.id === id)?.title)
    .filter(Boolean)
    .join(', ')
})
</script>

<template>
  <div>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full justify-between font-normal"
        >
          <span class="truncate">{{ displayText }}</span>
          <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0 w-[var(--reka-popper-anchor-width)]">
        <Command>
          <CommandInput placeholder="Search documents..." />
          <CommandList>
            <CommandEmpty>No documents found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                v-for="document in documents"
                :key="document.id"
                :value="document.id"
                @select="toggleSelection(document.id)"
              >
                <CheckIcon
                  :class="[
                    'mr-2 h-4 w-4',
                    isSelected(document.id) ? 'opacity-100' : 'opacity-0'
                  ]"
                />
                {{ document.title }}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <template v-for="id in selected" :key="id">
      <input hidden :name="field.name" type="text" :value="id" />
    </template>
  </div>
</template>
