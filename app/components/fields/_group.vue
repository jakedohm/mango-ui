<script setup>
import { EllipsisIcon, TrashIcon } from 'lucide-vue-next'

const model = defineModel({ type: Object })

const props = defineProps({
  field: Object,
  repeatable: {
    type: Boolean,
    default: false
  },
  name: String,
  error: Object
})

const emit = defineEmits(['delete'])
</script>

<template>
  <div
    class="relative z-10 grid __grid-cols-2 gap-3 px-2 py-3 bg-gray-50 border border-input rounded-sm -m-[1px]"
    :class="[repeatable ? '' : 'shadow-xs']"
  >
    <MangoField
      v-for="subfield in field.fields"
      :field="subfield"
      :name="`${name ?? field.name}[${subfield.name}]`"
      v-model="model[subfield.name]"
    />

    <DropdownMenu v-if="repeatable">
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <EllipsisIcon class="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem variant="destructive" @click="emit('delete')">
          <TrashIcon class="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
