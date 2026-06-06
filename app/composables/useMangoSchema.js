import collections from '@collections'
import settings from '@settings'

/*
  Turns the Mango instance schema (.collections.json + settings) into a compact
  description the AI assistant can reason over: collection names, singulars,
  field names + types, relationships, and which fields are computed (read-only).

  Kept terse on purpose — this is injected into every model turn, so it pays to
  be token-efficient while still unambiguous.
*/

function fieldLine(f) {
  const bits = [f.name]
  let type = f.type || 'String'
  if (f.relationship) {
    const target = f.relationship.collection || f.relationship || 'unknown'
    type = `Relationship<${target}>`
  } else if (Array.isArray(f.type)) {
    type = `[${f.type[0]}]`
  }
  bits.push(`:${type}`)
  const tags = []
  if (f.computed) tags.push('computed/read-only')
  if (f.required) tags.push('required')
  if (f.unique) tags.push('unique')
  if (tags.length) bits.push(`(${tags.join(', ')})`)
  return bits.join('')
}

export const useMangoSchema = () => {
  // Plain JS object form, handy for programmatic tool execution.
  const describeCollections = () =>
    collections.map((c) => ({
      name: c.name,
      singular: c.singular,
      title: c.titleName,
      titleSingular: c.titleSingular,
      fields: (c.fields || []).map((f) => ({
        name: f.name,
        type: Array.isArray(f.type) ? `[${f.type[0]}]` : f.type || 'String',
        relationship: f.relationship?.collection || f.relationship || null,
        computed: !!f.computed,
        required: !!f.required
      }))
    }))

  // Compact text form for the system prompt.
  const schemaText = computed(() => {
    const lines = []
    lines.push(`Site: ${settings?.siteName || 'Mango instance'}`)
    lines.push(`Collections (${collections.length}):`)
    for (const c of collections) {
      const fields = (c.fields || [])
        .filter((f) => !f.name?.startsWith('_'))
        .map(fieldLine)
        .join(', ')
      lines.push(`- ${c.name} (singular: ${c.singular}) — ${fields}`)
    }
    return lines.join('\n')
  })

  const collectionNames = computed(() => collections.map((c) => c.name))

  function findCollection(nameOrSingular) {
    const q = String(nameOrSingular || '').toLowerCase()
    return (
      collections.find((c) => c.name.toLowerCase() === q) ||
      collections.find((c) => c.singular?.toLowerCase() === q) ||
      collections.find((c) => c.titleName?.toLowerCase() === q) ||
      null
    )
  }

  return { schemaText, describeCollections, collectionNames, findCollection }
}
