import { toast } from 'vue-sonner'
import { useMangoSchema } from '~/composables/useMangoSchema'
import { useMangoActions } from '~/composables/useMangoActions'

/*
  The assistant "brain": holds the conversation, the OpenAI tool catalog, the
  tool-execution dispatch, and the human-in-the-loop approval queue. Shared as a
  singleton (useState) so the dashboard widget, the docked panel, and the voice
  session all drive the same conversation and the same pending approvals.
*/

let _id = 0
const nextId = () => `m${++_id}`

// Tool catalog advertised to the model. Read/nav tools run immediately; the
// propose_* tools only stage a change for human approval.
export const ASSISTANT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_collections',
      description:
        'List all collections in this Mango instance with their fields and types. Call this when you need to know the schema before searching or editing.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_documents',
      description:
        'Full-text search documents in a collection. Returns matching documents with their ids and labels.',
      parameters: {
        type: 'object',
        properties: {
          collection: { type: 'string', description: 'Collection name or singular' },
          query: { type: 'string', description: 'Search term (matches string fields)' },
          limit: { type: 'integer', description: 'Max results (default 10)' }
        },
        required: ['collection']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_document',
      description: 'Fetch a single document by id from a collection.',
      parameters: {
        type: 'object',
        properties: {
          collection: { type: 'string' },
          id: { type: 'string' }
        },
        required: ['collection', 'id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate',
      description:
        'Navigate the admin UI to an arbitrary path (e.g. "/collections/posts").',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_document',
      description:
        'Open a document edit page in the admin UI. Use id "new" to start a new document.',
      parameters: {
        type: 'object',
        properties: { collection: { type: 'string' }, id: { type: 'string' } },
        required: ['collection', 'id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_public_site',
      description: 'Open the public-facing site at a given path in a new tab.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' } }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_update',
      description:
        'Stage an update to an existing document for the user to approve. Does NOT apply until approved.',
      parameters: {
        type: 'object',
        properties: {
          collection: { type: 'string' },
          id: { type: 'string' },
          changes: {
            type: 'object',
            description: 'Field -> new value map of the fields to change',
            additionalProperties: true
          }
        },
        required: ['collection', 'id', 'changes']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_create',
      description:
        'Stage creation of a new document for the user to approve. Does NOT apply until approved.',
      parameters: {
        type: 'object',
        properties: {
          collection: { type: 'string' },
          data: { type: 'object', additionalProperties: true }
        },
        required: ['collection', 'data']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_delete',
      description:
        'Stage deletion of a document for the user to approve. Does NOT apply until approved.',
      parameters: {
        type: 'object',
        properties: { collection: { type: 'string' }, id: { type: 'string' } },
        required: ['collection', 'id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_batch',
      description:
        'Stage multiple create/update/delete operations as one approvable batch.',
      parameters: {
        type: 'object',
        properties: {
          operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['create', 'update', 'delete'] },
                collection: { type: 'string' },
                id: { type: 'string' },
                changes: { type: 'object', additionalProperties: true },
                data: { type: 'object', additionalProperties: true }
              },
              required: ['kind', 'collection']
            }
          }
        },
        required: ['operations']
      }
    }
  }
]

export const useAssistant = () => {
  const { schemaText } = useMangoSchema()
  const actions = useMangoActions()

  const messages = useState('assistant-messages', () => [])
  const apiMessages = useState('assistant-api-messages', () => [])
  const approvals = useState('assistant-approvals', () => [])
  const busy = useState('assistant-busy', () => false)
  const notConfigured = useState('assistant-misconfigured', () => false)
  const configured = useState('assistant-configured', () => null) // null = unknown
  const savingKey = useState('assistant-saving-key', () => false)

  // Ask the server whether an OpenAI key is configured (without revealing it).
  async function checkConfig() {
    try {
      const res = await $fetch('/api/assistant/config')
      configured.value = !!res?.configured
      notConfigured.value = !res?.configured
      return res
    } catch {
      // Treat an error as "unknown" rather than blocking the UI.
      return null
    }
  }

  // Persist a user-pasted OpenAI key to settings.json via the server.
  async function saveKey(key) {
    savingKey.value = true
    try {
      const res = await $fetch('/api/assistant/key', {
        method: 'POST',
        body: { key }
      })
      if (res?.configured) {
        configured.value = true
        notConfigured.value = false
        toast.success('OpenAI key saved', { duration: 3000 })
        return { ok: true }
      }
      return { ok: false, message: res?.message || 'Could not save the key.' }
    } catch (e) {
      const message = e?.data?.message || e?.message || 'Could not save the key.'
      return { ok: false, message }
    } finally {
      savingKey.value = false
    }
  }

  function systemPrompt() {
    return [
      'You are Mango, the built-in assistant for a Mango CMS admin dashboard.',
      'You help the user find, navigate to, and edit their content.',
      'You can read data and navigate freely, but every write (create, update, delete, batch) MUST go through a propose_* tool and is only applied after the user approves it in the UI. Never claim a change was saved until it is approved.',
      'Prefer calling list_collections / search_documents to ground yourself in real ids and field names before proposing edits. Never invent document ids.',
      'Be concise. When you stage a change, tell the user to review and approve it above.',
      '',
      'Instance schema:',
      schemaText.value
    ].join('\n')
  }

  function reset() {
    messages.value = []
    apiMessages.value = []
    approvals.value = []
  }

  function pushUser(text) {
    messages.value.push({ id: nextId(), role: 'user', content: text })
  }
  function pushAssistant(text) {
    if (text) messages.value.push({ id: nextId(), role: 'assistant', content: text })
  }
  function pushSystemNote(text) {
    messages.value.push({ id: nextId(), role: 'note', content: text })
  }

  // Execute a tool the model asked for. Returns a JSON-serialisable result.
  async function execTool(name, args) {
    try {
      switch (name) {
        case 'list_collections':
          return { collections: actions.describeCollections() }
        case 'search_documents':
          return await actions.searchDocuments(args)
        case 'get_document':
          return await actions.getDocument(args)
        case 'navigate':
          return actions.navigate(args)
        case 'navigate_to_document':
          return actions.navigateToDocument(args)
        case 'open_public_site':
          return actions.openPublicSite(args)
        case 'propose_update':
          return stageProposal(actions.proposeUpdate(args))
        case 'propose_create':
          return stageProposal(actions.proposeCreate(args))
        case 'propose_delete':
          return stageProposal(actions.proposeDelete(args))
        case 'propose_batch':
          return stageProposal(actions.proposeBatch(args))
        default:
          return { error: `Unknown tool ${name}` }
      }
    } catch (e) {
      return { error: e?.message || String(e) }
    }
  }

  function stageProposal(proposal) {
    const id = nextId()
    const entry = reactive({ id, proposal, status: 'pending' })
    approvals.value.push(entry)
    messages.value.push({ id: nextId(), role: 'approval', approvalId: id })
    return { status: 'awaiting_user_approval', proposalId: id, summary: proposal.summary }
  }

  async function approve(approvalId) {
    const entry = approvals.value.find((a) => a.id === approvalId)
    if (!entry || entry.status !== 'pending') return
    entry.status = 'applying'
    try {
      const result = await actions.applyProposal(entry.proposal)
      entry.status = 'applied'
      entry.result = result
      toast.success('Change applied', { duration: 3000 })
      // Let the model know it landed so follow-up turns stay accurate.
      apiMessages.value.push({
        role: 'user',
        content: `[system] The user approved and applied: ${entry.proposal.summary}.`
      })
    } catch (e) {
      entry.status = 'error'
      entry.error = e?.message || String(e)
      toast.error('Failed to apply change', {
        description: entry.error,
        richColors: true
      })
    }
  }

  function reject(approvalId) {
    const entry = approvals.value.find((a) => a.id === approvalId)
    if (!entry || entry.status !== 'pending') return
    entry.status = 'rejected'
    apiMessages.value.push({
      role: 'user',
      content: `[system] The user rejected: ${entry.proposal.summary}.`
    })
  }

  function getApproval(id) {
    return approvals.value.find((a) => a.id === id)
  }

  // Drive the chat: user message -> model -> tool calls -> model -> ... .
  async function send(text) {
    if (busy.value) return
    const clean = (text || '').trim()
    if (!clean) return

    if (apiMessages.value.length === 0) {
      apiMessages.value.push({ role: 'system', content: systemPrompt() })
    }
    pushUser(clean)
    apiMessages.value.push({ role: 'user', content: clean })

    busy.value = true
    try {
      await runLoop()
    } finally {
      busy.value = false
    }
  }

  async function runLoop() {
    for (let round = 0; round < 6; round++) {
      let res
      try {
        res = await $fetch('/api/assistant/chat', {
          method: 'POST',
          body: { messages: apiMessages.value, tools: ASSISTANT_TOOLS }
        })
      } catch (e) {
        res = e?.data || { error: 'network', message: e?.message }
      }

      if (res?.error) {
        if (res.error === 'assistant_not_configured') notConfigured.value = true
        pushSystemNote(res.message || 'The assistant is unavailable right now.')
        return
      }

      const msg = res.message
      if (!msg) {
        pushSystemNote('No response from the assistant.')
        return
      }
      apiMessages.value.push(msg)
      if (msg.content) pushAssistant(msg.content)

      const calls = msg.tool_calls || []
      if (!calls.length) return

      for (const tc of calls) {
        let args = {}
        try {
          args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {}
        } catch {}
        const result = await execTool(tc.function?.name, args)
        apiMessages.value.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result ?? {})
        })
      }
    }
    pushSystemNote('Stopped after several tool rounds to avoid a loop.')
  }

  return {
    messages,
    approvals,
    busy,
    notConfigured,
    configured,
    savingKey,
    checkConfig,
    saveKey,
    send,
    reset,
    approve,
    reject,
    getApproval,
    execTool,
    systemPrompt
  }
}
