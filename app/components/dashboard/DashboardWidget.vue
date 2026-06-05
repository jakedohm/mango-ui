<script setup>
import { GripVerticalIcon, XIcon } from 'lucide-vue-next'
import { WIDGET_TYPES, useDashboard } from '~/composables/useDashboard'

const props = defineProps({
  widget: { type: Object, required: true }
})

defineEmits(['dragStart', 'resizeStart'])

const { editMode, removeWidget } = useDashboard()

const spec = computed(() => WIDGET_TYPES[props.widget.type])
const component = computed(() =>
  spec.value ? resolveComponent(spec.value.component) : null
)
</script>

<template>
  <div class="group/widget flex flex-col">
    <div
      class="relative flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow"
      :class="editMode ? 'ring-1 ring-border hover:shadow-md' : ''"
    >
      <!-- Edit chrome: drag handle + remove -->
      <div
        v-if="editMode"
        class="flex items-center justify-between border-b bg-muted/40 px-2 py-1"
      >
        <button
          type="button"
          class="flex cursor-grab items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted active:cursor-grabbing"
          @pointerdown="$emit('dragStart', $event)"
        >
          <GripVerticalIcon class="size-3.5" />
          <span class="font-medium">{{ spec?.label || widget.type }}</span>
        </button>
        <button
          type="button"
          class="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Remove widget"
          @click="removeWidget(widget.id)"
        >
          <XIcon class="size-3.5" />
        </button>
      </div>

      <!-- Widget body -->
      <div class="relative min-h-0 flex-1 overflow-auto">
        <component
          :is="component"
          v-if="component"
          :widget="widget"
          class="h-full"
        />
        <div v-else class="p-4 text-sm text-muted-foreground">
          Unknown widget: {{ widget.type }}
        </div>
        <!-- Block interaction with the widget contents while editing -->
        <div v-if="editMode" class="absolute inset-0 cursor-grab" @pointerdown="$emit('dragStart', $event)" />
      </div>

      <!-- Resize handle -->
      <div
        v-if="editMode"
        class="absolute bottom-0 right-0 flex size-5 cursor-se-resize items-end justify-end p-1 text-muted-foreground/60 hover:text-foreground"
        @pointerdown="$emit('resizeStart', $event)"
      >
        <svg viewBox="0 0 10 10" class="size-2.5 fill-current">
          <path d="M10 0v10H8V2H0V0z" opacity="0.5" />
          <path d="M10 6v4H6V8h2V6z" />
        </svg>
      </div>
    </div>
  </div>
</template>
