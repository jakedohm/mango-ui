import collections from '../../mango/config/.collections.json'

const RECENT_STORAGE_KEY = 'mango-recent-pages'
const MAX_RECENT = 3

// Shared state across all components
const recentPages = ref([])
const isLoaded = ref(false)

export const useRecentPages = () => {
  function loadRecentPages() {
    if (import.meta.client && !isLoaded.value) {
      try {
        const stored = localStorage.getItem(RECENT_STORAGE_KEY)
        recentPages.value = stored ? JSON.parse(stored) : []
        isLoaded.value = true
      } catch {
        recentPages.value = []
      }
    }
  }

  function saveToStorage() {
    if (import.meta.client) {
      localStorage.setItem(
        RECENT_STORAGE_KEY,
        JSON.stringify(recentPages.value)
      )
    }
  }

  function saveRecentPage(page) {
    if (!import.meta.client) return

    // Don't track login page
    if (page.path === '/login') return

    // Load first if needed
    loadRecentPages()

    // Remove if already exists (to move to top)
    const filtered = recentPages.value.filter((p) => p.path !== page.path)

    // Add to beginning
    filtered.unshift(page)

    // Keep only MAX_RECENT items
    recentPages.value = filtered.slice(0, MAX_RECENT)

    saveToStorage()
  }

  function updateRecentPageTitle(path, title, documentTitle) {
    if (!import.meta.client) return

    // Load first if needed
    loadRecentPages()

    const index = recentPages.value.findIndex((p) => p.path === path)
    if (index !== -1) {
      recentPages.value[index].title = title
      recentPages.value[index].documentTitle = documentTitle
      saveToStorage()
    }
  }

  function getPageTitle(path) {
    const parts = path.split('/').filter(Boolean)

    if (parts.length === 0) return 'Home'

    if (parts[0] === 'collections') {
      const collectionName = parts[1]
      const collection = collections.find((c) => c.name === collectionName)

      if (parts[2] === 'new') {
        return `New ${collection?.titleSingular || collectionName}`
      } else if (parts[2]) {
        return collection?.titleSingular || collectionName
      }
      return collection?.titleName || collectionName
    }

    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  }

  // Load on first use
  if (import.meta.client) {
    loadRecentPages()
  }

  return {
    recentPages: readonly(recentPages),
    loadRecentPages,
    saveRecentPage,
    updateRecentPageTitle,
    getPageTitle
  }
}
