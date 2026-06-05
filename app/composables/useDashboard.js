import settings from '@settings'

/*
  Dashboard layout state for the interactive home screen.

  Widgets live on a free-placement grid (overlap allowed) measured in grid
  units: { id, type, x, y, w, h, props }. The layout is persisted to
  localStorage, namespaced per instance + per user so different sites / accounts
  on the same browser don't clobber each other.
*/

export const GRID_COLUMNS = 12
export const GRID_ROW_HEIGHT = 84 // px, the height of one grid row
export const GRID_GAP = 12 // px, gap between cells

// Registry of available widget types. `component` is the global component name
// Nuxt auto-imports (pathPrefix: false flattens component names).
export const WIDGET_TYPES = {
  welcome: {
    label: 'Welcome',
    description: 'Greeting and quick orientation',
    component: 'WelcomeWidget',
    default: { w: 6, h: 2 },
    min: { w: 3, h: 2 }
  },
  recent: {
    label: 'Recent pages',
    description: 'Jump back to where you left off',
    component: 'RecentPagesWidget',
    default: { w: 3, h: 4 },
    min: { w: 2, h: 2 }
  },
  stats: {
    label: 'Collection stats',
    description: 'Live document counts per collection',
    component: 'CollectionStatsWidget',
    default: { w: 3, h: 4 },
    min: { w: 2, h: 2 }
  },
  quickCreate: {
    label: 'Quick create',
    description: 'Create a new document in one click',
    component: 'QuickCreateWidget',
    default: { w: 3, h: 3 },
    min: { w: 2, h: 2 }
  },
  notes: {
    label: 'Notes',
    description: 'A scratchpad that sticks around',
    component: 'NotesWidget',
    default: { w: 3, h: 3 },
    min: { w: 2, h: 2 }
  },
  assistant: {
    label: 'AI assistant',
    description: 'Chat or talk to Mango about your data',
    component: 'AssistantWidget',
    default: { w: 6, h: 6 },
    min: { w: 3, h: 4 }
  }
}

function defaultLayout() {
  return [
    { id: 'w-welcome', type: 'welcome', x: 0, y: 0, w: 6, h: 2 },
    { id: 'w-assistant', type: 'assistant', x: 0, y: 2, w: 6, h: 6 },
    { id: 'w-recent', type: 'recent', x: 6, y: 0, w: 3, h: 4 },
    { id: 'w-stats', type: 'stats', x: 9, y: 0, w: 3, h: 4 },
    { id: 'w-quick', type: 'quickCreate', x: 6, y: 4, w: 3, h: 4 },
    { id: 'w-notes', type: 'notes', x: 9, y: 4, w: 3, h: 4 }
  ]
}

let _counter = 0
function makeId(type) {
  _counter += 1
  return `w-${type}-${_counter}`
}

export const useDashboard = () => {
  const { user } = useAuth()

  const storageKey = computed(() => {
    const site = settings?.siteName || 'mango'
    const who = user.value?.id || 'anon'
    return `mango-dashboard:${site}:${who}`
  })

  const widgets = useState('dashboard-widgets', () => defaultLayout())
  const editMode = useState('dashboard-edit', () => false)
  const loaded = useState('dashboard-loaded', () => false)

  function load() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(storageKey.value)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed?.widgets)) {
          widgets.value = parsed.widgets
        }
      }
    } catch (e) {
      console.warn('Failed to load dashboard layout', e)
    } finally {
      loaded.value = true
    }
  }

  function persist() {
    if (!import.meta.client || !loaded.value) return
    try {
      localStorage.setItem(
        storageKey.value,
        JSON.stringify({ version: 1, widgets: widgets.value })
      )
    } catch (e) {
      console.warn('Failed to persist dashboard layout', e)
    }
  }

  // Persist whenever the layout changes (deep), but only after initial load so
  // we never overwrite stored state with the default before it's read.
  watch(widgets, persist, { deep: true })

  function updateWidget(id, patch) {
    const idx = widgets.value.findIndex((w) => w.id === id)
    if (idx === -1) return
    widgets.value[idx] = { ...widgets.value[idx], ...patch }
  }

  function addWidget(type) {
    const spec = WIDGET_TYPES[type]
    if (!spec) return
    // Drop it at the bottom of the current layout so it's always visible.
    const bottom = widgets.value.reduce((m, w) => Math.max(m, w.y + w.h), 0)
    widgets.value.push({
      id: makeId(type),
      type,
      x: 0,
      y: bottom,
      w: spec.default.w,
      h: spec.default.h,
      props: {}
    })
  }

  function removeWidget(id) {
    widgets.value = widgets.value.filter((w) => w.id !== id)
  }

  function resetLayout() {
    widgets.value = defaultLayout()
  }

  return {
    widgets,
    editMode,
    loaded,
    storageKey,
    load,
    updateWidget,
    addWidget,
    removeWidget,
    resetLayout
  }
}
