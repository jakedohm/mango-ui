<script setup>
import { useElementSize } from '@vueuse/core'
import {
  GRID_COLUMNS,
  GRID_ROW_HEIGHT,
  GRID_GAP,
  WIDGET_TYPES,
  useDashboard
} from '~/composables/useDashboard'

const { widgets, editMode, updateWidget } = useDashboard()

const canvas = ref(null)
const { width: canvasWidth } = useElementSize(canvas)

// Pixel size of one column, derived from the live canvas width.
const cellWidth = computed(() => {
  const w = canvasWidth.value || 0
  if (!w) return 0
  return (w - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS
})

const stepX = computed(() => cellWidth.value + GRID_GAP)
const stepY = computed(() => GRID_ROW_HEIGHT + GRID_GAP)

// Geometry for a widget in pixels.
function geom(w) {
  return {
    left: w.x * stepX.value,
    top: w.y * stepY.value,
    width: Math.max(0, w.w * cellWidth.value + (w.w - 1) * GRID_GAP),
    height: w.h * GRID_ROW_HEIGHT + (w.h - 1) * GRID_GAP
  }
}

// Canvas height: tallest widget bottom, plus headroom in edit mode for dropping.
const rowsUsed = computed(() =>
  widgets.value.reduce((m, w) => Math.max(m, w.y + w.h), 0)
)
const canvasRows = computed(() =>
  editMode.value ? rowsUsed.value + 4 : Math.max(rowsUsed.value, 1)
)
const canvasHeight = computed(
  () => canvasRows.value * stepY.value - GRID_GAP
)

// ---- drag / resize engine ----------------------------------------------
const drag = ref(null) // { id, mode, startPx, origin }

function onPointerDown(e, widget, mode) {
  if (!editMode.value) return
  if (e.button !== undefined && e.button !== 0) return
  e.preventDefault()
  e.stopPropagation()
  drag.value = {
    id: widget.id,
    mode, // 'move' | 'resize'
    startX: e.clientX,
    startY: e.clientY,
    origin: { x: widget.x, y: widget.y, w: widget.w, h: widget.h }
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  const d = drag.value
  if (!d) return
  const dxCells = Math.round((e.clientX - d.startX) / stepX.value)
  const dyCells = Math.round((e.clientY - d.startY) / stepY.value)
  const widget = widgets.value.find((w) => w.id === d.id)
  if (!widget) return
  const spec = WIDGET_TYPES[widget.type]
  const min = spec?.min || { w: 2, h: 2 }

  if (d.mode === 'move') {
    const x = clamp(d.origin.x + dxCells, 0, GRID_COLUMNS - widget.w)
    const y = Math.max(0, d.origin.y + dyCells)
    if (x !== widget.x || y !== widget.y) updateWidget(d.id, { x, y })
  } else {
    const w = clamp(d.origin.w + dxCells, min.w, GRID_COLUMNS - widget.x)
    const h = Math.max(min.h, d.origin.h + dyCells)
    if (w !== widget.w || h !== widget.h) updateWidget(d.id, { w, h })
  }
}

function onPointerUp() {
  drag.value = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi)
}

onBeforeUnmount(onPointerUp)
</script>

<template>
  <div
    ref="canvas"
    class="relative w-full transition-[height] duration-150"
    :class="editMode ? 'dashboard-grid-bg rounded-lg' : ''"
    :style="{
      height: canvasHeight + 'px',
      '--cell-w': cellWidth + 'px',
      '--step-x': stepX + 'px',
      '--step-y': stepY + 'px'
    }"
  >
    <DashboardWidget
      v-for="w in widgets"
      :key="w.id"
      :widget="w"
      :style="{
        position: 'absolute',
        left: geom(w).left + 'px',
        top: geom(w).top + 'px',
        width: geom(w).width + 'px',
        height: geom(w).height + 'px'
      }"
      :class="drag && drag.id === w.id ? 'z-30 select-none' : 'z-10'"
      @drag-start="(e) => onPointerDown(e, w, 'move')"
      @resize-start="(e) => onPointerDown(e, w, 'resize')"
    />
  </div>
</template>

<style scoped>
/* Subtle dotted grid only while editing, aligned to the cell step. */
.dashboard-grid-bg {
  background-image: radial-gradient(
    circle,
    color-mix(in oklch, var(--foreground) 14%, transparent) 1px,
    transparent 1px
  );
  background-size: var(--step-x) var(--step-y);
  background-position: calc(var(--cell-w) / 2) calc(var(--step-y) / 2 - 6px);
}
</style>
