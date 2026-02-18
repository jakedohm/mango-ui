// import collections from '../../../mango/config/.collections.json'
// import { algoliaAppId, algoliaSearchKey, algoliaIndex, port, domain } from '../../../mango/config/settings'
import collections from '../../../mango/config/.collections.json'
import {
  port,
  mangoDomain,
  useDevAPI
} from '../../../mango/config/settings.json'
import axios from 'axios'

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

const Mango = collections.reduce((a, c) => {
  let runQuery = ({
    limit,
    page,
    search,
    fields,
    id,
    sort,
    depthLimit
  } = {}) => {
    let fullQuery

    const params = { limit, page, search, fields, sort, depthLimit }

    if (params.search != undefined)
      params.search = JSON.stringify(params.search)
    if (params.fields != undefined)
      params.fields = JSON.stringify(params.fields)
    if (params.sort != undefined) params.sort = JSON.stringify(params.sort)

    const query =
      Object.keys(params)
        .filter((key) => params[key] != undefined)
        ?.map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        )
        ?.join('&') || ''

    fullQuery = `${api}/${c.name}/${id || ''}?${query}`

    const key = `${c.name}_${fullQuery}`
    return useAsyncData(key, () => {
      // Forward cookies during SSR so the backend can identify the user
      const headers = {}
      if (import.meta.server) {
        const event = useRequestEvent()
        const cookie = event?.node?.req?.headers?.cookie
        if (cookie) {
          headers.cookie = cookie
        }
      }

      return $fetch(fullQuery, {
        credentials: 'include',
        headers
      }).then((response) => response?.response)
    })
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
