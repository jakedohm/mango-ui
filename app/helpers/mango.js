// import { algoliaAppId, algoliaSearchKey, algoliaIndex, port, domain } from '../../../mango/config/settings'
import collections from '../../../mango/config/.collections.json'
import {
  port,
  mangoDomain,
  useDevAPI
} from '../../../mango/config/settings.json'
import axios from 'axios'
import { toast } from 'vue-sonner'

// Configure axios to send credentials (cookies) with all requests
axios.defaults.withCredentials = true

let endpoints = {
  authors: ['get']
}

// console.log('collections', collections)

let api = `https://${mangoDomain}`
// let ws = `wss://${mangoDomain}/graphql`;

if (process.env.NODE_ENV != 'production' && useDevAPI) {
  api = `http://localhost:${port}`
  // ws = `ws://localhost:${port}/graphql`;
}

// Export API base URL for use in auth composable
export { api }

function transformSearch(search, collectionFields) {
  if (search == null) return search

  // If search is a string, treat as single term searching all fields
  if (typeof search === 'string') {
    if (!search.trim()) return null
    search = { [search]: null }
  }

  // Check if this is the new format (keys are terms, values are null or field arrays)
  const isNewFormat = Object.values(search).every(
    (v) => v === null || Array.isArray(v)
  )
  if (!isNewFormat) return search

  // Get all String fields for "all fields" searches
  const stringFields = collectionFields
    .filter((f) => f.type === 'String' && !f.computed)
    .map((f) => f.name)

  // Build $or conditions
  const orConditions = []

  for (const [term, fields] of Object.entries(search)) {
    // Skip empty/whitespace-only terms
    if (!term.trim()) continue

    // Use specified fields, or all string fields if null
    const targetFields = fields ?? stringFields
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    for (const field of targetFields) {
      orConditions.push({ [field]: { $regex: escapedTerm, $options: 'i' } })
    }
  }

  return orConditions.length ? { $or: orConditions } : {}
}

const wait = (length) => new Promise((resolve) => setTimeout(resolve, length))

const Mango = collections.reduce((a, c) => {
  let runQuery = async (options = {}) => {
    // Helper to check if value is a getter function
    const isGetter = (val) => typeof val === 'function'

    // Helper to unwrap getter functions at evaluation time
    const unwrap = (val) => (typeof val === 'function' ? val() : val)

    // Extract debounce option
    const debounceMs = options.debounce

    // Collect getter functions for auto-refresh
    const paramKeys = [
      'limit',
      'page',
      'search',
      'fields',
      'id',
      'sort',
      'depthLimit'
    ]
    const watchSources = paramKeys.map((k) => options[k]).filter(isGetter)

    // Build stable cache key (collection + static id if provided)
    const staticId = !isGetter(options.id) ? options.id : undefined
    const cacheKey = `${c.name}_${staticId || 'query'}`

    const asyncData = useAsyncData(
      cacheKey,
      () => {
        // Unwrap all params at fetch time
        const params = {
          limit: unwrap(options.limit),
          page: unwrap(options.page),
          search: unwrap(options.search),
          fields: unwrap(options.fields),
          sort: unwrap(options.sort),
          depthLimit: unwrap(options.depthLimit)
        }
        const id = unwrap(options.id)

        if (params.search != undefined) {
          params.search = transformSearch(params.search, c.fields)
          // Don't send empty/null search
          if (
            params.search == null ||
            Object.keys(params.search).length === 0
          ) {
            params.search = undefined
          } else {
            params.search = JSON.stringify(params.search)
          }
        }
        if (params.fields != undefined)
          params.fields = JSON.stringify(params.fields)
        if (params.sort != undefined) params.sort = JSON.stringify(params.sort)

        if (options?.limit !== undefined) {
          params.verbose = true
        }

        const query =
          Object.keys(params)
            .filter((key) => params[key] != undefined)
            ?.map(
              (key) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
            )
            ?.join('&') || ''

        const fullQuery = `${api}/${c.name}/${id || ''}?${query}`

        // Forward cookies during SSR so the backend can identify the user
        const headers = {}
        if (import.meta.server) {
          const event = useRequestEvent()
          const cookie = event?.node?.req?.headers?.cookie
          if (cookie) {
            headers.cookie = cookie
          }
        }

        const waitTime = options.wait && import.meta.client ? options.wait : 0
        console.log({ waitTime })

        return wait(waitTime).then(() =>
          $fetch(fullQuery, {
            credentials: 'include',
            headers
          }).catch((e) => {
            if (import.meta.client) {
              toast.error('Loading data failed. Please try again.', {
                richColors: true,
                duration: 5000
              })
            }

            // Preserve previous data on error
            const nuxt = useNuxtApp()
            const previousData = nuxt.payload.data[cacheKey]
            if (previousData) {
              return previousData
            }

            throw e
          })
        )
      },
      {
        watch: !debounceMs && watchSources.length ? watchSources : undefined
      }
    )

    // If debounce is set, manually watch with debounce
    if (debounceMs && watchSources.length) {
      let timeoutId
      watch(watchSources, () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          asyncData.refresh()
        }, debounceMs)
      })
    }

    // Wait for initial data to be fetched (enables navigation blocking)
    await asyncData

    // Expose items as `data` (backwards compatible) and `count` separately
    const data = computed(() => asyncData.data.value?.response)
    const count = computed(() => asyncData.data.value?.count)

    return { ...asyncData, data, count }
  }

  let save = (data, options = {}) => {
    let { id } = data
    let method = id ? 'put' : 'post'

    // // Remove _id and computed fields
    delete data.collection
    delete data._id
    delete data.id

    for (let field of c.fields) {
      if (field.computed) delete data[field.name]
      if (field.relationship)
        data[field.name] = Array.isArray(data[field.name])
          ? data[field.name].map((r) => r?.id || r)
          : data[field.name]?.id
            ? data[field.name].id
            : data[field.name]
    }
    for (let name in data) {
      if (name.includes('__')) delete data[name]
    }

    let payload = { ...data }
    let headers = {
      ...options.headers
    }

    console.log({ api, c })
    return new Promise((resolve, reject) => {
      axios[method](`${api}/${c.name}/${id || ''}`, payload, {
        headers,
        withCredentials: true
      })
        .then((response) => {
          if (response?.data?.success) {
            refreshKeyedData(c.name)
            return resolve(response?.data?.response)
          } else {
            reject(response.data)
          }
        })
        .catch((e) => reject(e))
    })
  }

  let deleteEntry = (data) => {
    let id = data.id || data

    return new Promise((resolve, reject) => {
      axios
        .delete(`${api}/${c.name}/${id || ''}`, { withCredentials: true })
        .then((response) => {
          refreshKeyedData(c.name)
          return resolve(response?.data)
        })
        .catch((e) => reject(e))
    })
  }

  a[c.name] = runQuery
  a[c.name]['save'] = save
  a[c.name]['delete'] = deleteEntry
  a[c.singular] = (id, query) => runQuery({ id, ...query })

  return a
}, {})

Mango.collections = collections

function refreshKeyedData(key) {
  const Nuxt = useNuxtApp()
  const data = Nuxt.payload.data

  // Only on client
  if (!Nuxt || !data) {
    return false
  }

  // Filter keys that start with the given prefix
  const matchingKeys = Object.keys(data).filter((k) => {
    return k.startsWith(key + '_')
  })

  if (matchingKeys.length === 0) return false

  return refreshNuxtData(matchingKeys)
}

export { Mango }
