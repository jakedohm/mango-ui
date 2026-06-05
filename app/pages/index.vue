<script setup>
import { PencilRulerIcon, PlusIcon, CheckIcon, RotateCcwIcon } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { WIDGET_TYPES, useDashboard } from '~/composables/useDashboard'

useHead({ title: 'Dashboard – Mango' })
useSeoMeta({
  description:
    'Your interactive Mango dashboard. Arrange widgets on a grid and ask the built-in AI assistant to find, navigate, and edit your content.'
})

const { editMode, load, addWidget, resetLayout, loaded } = useDashboard()

onMounted(() => {
  if (!loaded.value) load()
})

const widgetOptions = Object.entries(WIDGET_TYPES).map(([key, spec]) => ({
  key,
  ...spec
}))
</script>

<template>
  <div class="relative min-h-screen p-6 pt-0">
    <PageHeader>
      <template #title>Dashboard</template>
      <template #right>
        <div class="flex items-center gap-2 pr-2">
          <DropdownMenu v-if="editMode">
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm hover:bg-muted"
              >
                <PlusIcon class="size-4" /> Add widget
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuItem
                v-for="opt in widgetOptions"
                :key="opt.key"
                @click="addWidget(opt.key)"
              >
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{{ opt.label }}</span>
                  <span class="text-xs text-muted-foreground">{{ opt.description }}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            v-if="editMode"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            @click="resetLayout"
          >
            <RotateCcwIcon class="size-4" /> Reset
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium"
            :class="editMode
              ? 'bg-foreground text-background hover:opacity-90'
              : 'border hover:bg-muted'"
            @click="editMode = !editMode"
          >
            <component :is="editMode ? CheckIcon : PencilRulerIcon" class="size-4" />
            {{ editMode ? 'Done' : 'Customize' }}
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="mt-4">
      <ClientOnly>
        <GridCanvas />
        <template #fallback>
          <div class="h-64 animate-pulse rounded-xl bg-muted/40" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
