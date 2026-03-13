<script setup>
import { MangoFieldRenderer } from './fields/MangoFieldRenderer.js'
import { CodeIcon, EyeIcon, PencilOffIcon, AsteriskIcon } from 'lucide-vue-next'

const model = defineModel('model-value')

const props = defineProps({
  field: {},
  error: {},
  level: Number,
  name: String
})

const mangoForm = inject('mangoForm', null)

function titleCase(str) {
  return str.replace(/\b\w/g, (l) => l.toUpperCase())
}

const readOnly = computed(() => {
  return props.field.computed === true
})

const isDirty = computed(() => {
  if (!mangoForm?.methods?.isFieldDirty) return false
  const fieldName = props.name ?? props.field.name
  return mangoForm.methods.isFieldDirty(fieldName)
})
</script>

<template>
  <Field :data-invalid="error" class="relative group gap-y-2">
    <div class="flex items-center gap-4 justify-between">
      <FieldLabel :for="field.name" class="relative w-full pl-1 gap-0.5">
        {{ field.displayName || titleCase(field.humanName) }}
        <span v-if="field.required" class="text-amber-500">*</span>
        <span v-if="readOnly"
          ><PencilOffIcon class="size-3 shrink-0 text-gray-500"
        /></span>
      </FieldLabel>

      <Sheet v-if="level === 1">
        <SheetTrigger
          class="px-2 py-1 text-gray-400 hover:text-gray-600 transition-[opacity,visibility] opacity-0 invisible group-hover:visible group-hover:opacity-100"
        >
          <CodeIcon class="size-3" />
        </SheetTrigger>
        <SheetContent class="overflow-y-scroll pb-6">
          <SheetHeader
            class="sticky top-0 border-b border-gray-200 bg-white/20 backdrop-blur"
          >
            <SheetTitle
              ><span class="font-mono text-sm border px-2 py-0.5 rounded-md">{{
                field.name
              }}</span></SheetTitle
            >
          </SheetHeader>
          <div class="px-4">
            <h3
              class="text-sm font-semibold uppercase tracking-wider text-gray-700"
            >
              Field
            </h3>
            <pre class="mt-2 text-sm">{{ field }}</pre>

            <h3
              class="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-700"
            >
              Value
            </h3>
            <pre class="mt-2 max-w-full text-wrap text-sm">{{ model }}</pre>
          </div>
        </SheetContent>
      </Sheet>

      <Transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="level === 1 && isDirty"
          class="absolute -left-8 bottom-0 border-r-2 border-amber-200 rounded-r-md h-full"
        ></div>
      </Transition>
    </div>

    <MangoFieldRenderer
      :field="field"
      v-model="model"
      :name="name ?? field.name"
      :placeholder="field.placeholder"
      :disabled="field.computed === true"
      :error="error"
    />
  </Field>

  <div v-if="level === 1" class="flex items-center gap-2 pt-6.5">
    <Transition
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-300"
      enter-from-class="opacity-0 translate-x-2"
      enter-to-class="opacity-100 translate-x-0"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-2"
    >
      <div
        v-if="error"
        class="block mt-1 text-sm pl-4 py-0.5 border-l-2 border-red-200"
      >
        <FieldError>{{ error.message }}</FieldError>
      </div>
    </Transition>
    <FieldDescription
      v-if="field.instructions"
      class="py-0.5 text-[14px] leading-tight text-left text-balance text-gray-500/80 border-l-2 pl-4"
    >
      {{ field.instructions }}
    </FieldDescription>
  </div>
</template>
