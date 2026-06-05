import collections from '@collections'
import settings from '@settings'
import { Mango, api } from '~/helpers/mango.js'
import { useMangoSchema } from '~/composables/useMangoSchema'

/*
  The capability layer the AI assistant drives. Read operations execute
  immediately; write operations (create / update / delete, single or batch)
  return a *proposal* that the assistant must get the user to approve before
  `applyProposal` actually commits it. This is what enforces "with your
  approval" — the model can never write without a human clicking approve.
*/

function stringFields(collection) {
  return (collection.fields || [])
    .filter((f) => (f.type === 'String' || !f.type) && !f.computed)
    .map((f) => f.name)
}

function buildSearch(collection, term) {
  if (!term) return undefined
  const escaped = String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const or = stringFields(collection).map((name) => ({
    [name]: { $regex: escaped, $options: 'i' }
  }))
  return or.length ? { $or: or } : undefined
}

export const useMangoActions = () => {
  const router = useRouter()
  const { findCollection, describeCollections } = useMangoSchema()

  // ---- reads ------------------------------------------------------------
  async function searchDocuments({ collection, query, limit = 10 }) {
    const c = findCollection(collection)
    if (!c) throw new Error(`Unknown collection "${collection}"`)
    const params = new URLSearchParams()
    const search = buildSearch(c, query)
    if (search) params.set('search', JSON.stringify(search))
    params.set('limit', String(Math.min(limit, 50)))
    params.set('page', '0')
    params.set('verbose', 'true')
    const res = await $fetch(`${api}/${c.name}/?${params.toString()}`, {
      credentials: 'include'
    })
    const docs = res?.response || []
    return {
      collection: c.name,
      count: res?.count ?? docs.length,
      results: docs.map((d) => slimDoc(c, d))
    }
  }

  async function getDocument({ collection, id }) {
    const c = findCollection(collection)
    if (!c) throw new Error(`Unknown collection "${collection}"`)
    const res = await $fetch(`${api}/${c.name}/${id}`, {
      credentials: 'include'
    })
    return res?.response || res
  }

  function slimDoc(c, d) {
    // Surface a human label + id, plus a few salient fields.
    const label = d.title || d.name || d.slug || d.email || d.id
    return { id: d.id || d._id, label, _collection: c.name, ...d }
  }

  // ---- navigation -------------------------------------------------------
  function navigate({ path }) {
    if (!path) throw new Error('navigate requires a path')
    router.push(path)
    return { navigatedTo: path }
  }

  function navigateToCollection({ collection }) {
    const c = findCollection(collection)
    if (!c) throw new Error(`Unknown collection "${collection}"`)
    router.push(`/collections/${c.name}`)
    return { navigatedTo: `/collections/${c.name}` }
  }

  function navigateToDocument({ collection, id }) {
    const c = findCollection(collection)
    if (!c) throw new Error(`Unknown collection "${collection}"`)
    const path = id === 'new' ? `/collections/${c.name}/new` : `/collections/${c.name}/${id}`
    router.push(path)
    return { navigatedTo: path }
  }

  function openPublicSite({ path = '/' }) {
    const domain = settings?.siteDomain
    if (!domain) throw new Error('No public siteDomain configured')
    const url = `https://${domain}${path.startsWith('/') ? path : '/' + path}`
    if (import.meta.client) window.open(url, '_blank', 'noopener')
    return { openedUrl: url }
  }

  // ---- writes (return proposals, never auto-commit) ---------------------
  function proposeUpdate({ collection, id, changes }) {
    const c = findCollection(collection)
    if (!c) throw new Error(`Unknown collection "${collection}"`)
    return {
      kind: 'update',
      collection: c.name,
      id,
      changes,
      summary: `Update ${c.titleSingular} ${id}`
    }
  }

  function proposeCreate({ collection, data }) {
    const c = findCollection(collection)
    if (!c) throw new Error(`Unknown collection "${collection}"`)
    return {
      kind: 'create',
      collection: c.name,
      data,
      summary: `Create a new ${c.titleSingular}`
    }
  }

  function proposeDelete({ collection, id }) {
    const c = findCollection(collection)
    if (!c) throw new Error(`Unknown collection "${collection}"`)
    return {
      kind: 'delete',
      collection: c.name,
      id,
      summary: `Delete ${c.titleSingular} ${id}`
    }
  }

  function proposeBatch({ operations }) {
    const ops = (operations || []).map((op) => {
      if (op.kind === 'update') return proposeUpdate(op)
      if (op.kind === 'create') return proposeCreate(op)
      if (op.kind === 'delete') return proposeDelete(op)
      throw new Error(`Unknown batch op kind "${op.kind}"`)
    })
    return {
      kind: 'batch',
      operations: ops,
      summary: `${ops.length} change${ops.length === 1 ? '' : 's'} across collections`
    }
  }

  // ---- commit (only called after explicit user approval) ----------------
  async function applyProposal(proposal) {
    if (proposal.kind === 'batch') {
      const results = []
      for (const op of proposal.operations) {
        results.push(await applyProposal(op))
      }
      return { applied: results.length, results }
    }
    if (proposal.kind === 'update') {
      const current = await getDocument({
        collection: proposal.collection,
        id: proposal.id
      })
      const merged = { ...current, ...proposal.changes, id: proposal.id }
      const saved = await Mango[proposal.collection].save(merged)
      return { kind: 'update', id: proposal.id, saved }
    }
    if (proposal.kind === 'create') {
      const saved = await Mango[proposal.collection].save({ ...proposal.data })
      return { kind: 'create', saved }
    }
    if (proposal.kind === 'delete') {
      await Mango[proposal.collection].delete(proposal.id)
      return { kind: 'delete', id: proposal.id }
    }
    throw new Error(`Cannot apply proposal of kind "${proposal.kind}"`)
  }

  return {
    describeCollections,
    searchDocuments,
    getDocument,
    navigate,
    navigateToCollection,
    navigateToDocument,
    openPublicSite,
    proposeUpdate,
    proposeCreate,
    proposeDelete,
    proposeBatch,
    applyProposal
  }
}
