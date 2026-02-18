<script setup>
import { PlusIcon } from 'lucide-vue-next'
import FieldGroupBlock from './_group.vue'
import { useMangoField } from '~/components/MangoForms.js'

const props = defineProps({
  field: Object
})

const model = defineModel({ type: Array, default: () => [] })

useMangoField({
  name: props.field.name,
  value: model
})

function addBlock() {
  const emptyBlock = props.field.fields.reduce((acc, subfield) => {
    acc[subfield.name] = ''
    return acc
  }, {})

  if (!model.value) {
    model.value = [emptyBlock]
  } else {
    model.value.push(emptyBlock)
  }
}

function deleteBlock(index) {
  model.value.splice(index, 1)
}
</script>

<template>
  <div>
    <div
      class="relative z-10 shadow-xs flex flex-col gap-2 p-2 bg-white rounded-md border border-input"
    >
      <template v-if="model?.length">
        <FieldGroupBlock
          v-for="(block, i) in model"
          :key="i"
          :name="`${field.name}[${i}]`"
          :field="field"
          :repeatable="true"
          v-model="model[i]"
          @delete="deleteBlock(i)"
        />
      </template>
      <div v-else class="py-6 text-center text-sm text-gray-400">
        No items yet
      </div>
    </div>
    <div
      class="mt-[-16px] pt-[16px] rounded-b-md border-t-0 bg-gray-50 border border-input"
    >
      <div class="p-2">
        <Button @click="addBlock" size="sm" type="button" variant="outline">
          <PlusIcon /> Add Block
        </Button>
      </div>
    </div>
  </div>
</template>
