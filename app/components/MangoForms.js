const forms = {}

function deepEqual(a, b) {
  // Unref Vue refs before comparing
  const valA = isRef(a) ? unref(a) : a
  const valB = isRef(b) ? unref(b) : b

  if (valA === valB) return true
  if (valA == null || valB == null) return valA === valB
  if (typeof valA !== typeof valB) return false
  if (typeof valA !== 'object') return valA === valB
  if (Array.isArray(valA) !== Array.isArray(valB)) return false

  if (Array.isArray(valA)) {
    if (valA.length !== valB.length) return false
    return valA.every((item, index) => deepEqual(item, valB[index]))
  }

  const keysA = Object.keys(valA)
  const keysB = Object.keys(valB)
  if (keysA.length !== keysB.length) return false

  return keysA.every((key) => deepEqual(valA[key], valB[key]))
}

function deepClone(obj) {
  // Unref Vue refs before cloning
  const value = isRef(obj) ? unref(obj) : obj
  if (value == null || typeof value !== 'object') return value

  if (Array.isArray(value)) return value.map(deepClone)
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, deepClone(v)])
  )
}

export function useForm(id, { hooks = {}, actions = {}, reset = false } = {}) {
  // Initialize form if it doesn't exist
  if (!forms[id]) {
    forms[id] = {
      status: ref('idle'),
      valid: ref(false),
      actions: ref({}),
      hooks: hooks,
      fieldValues: ref({}),
      initialFieldValues: ref({})
    }
  }

  const form = forms[id]

  // Reset field values only (preserve actions/hooks for child components)
  if (reset) {
    form.fieldValues.value = {}
    form.initialFieldValues.value = {}
  }

  if (actions) {
    form.actions.value = { ...form.actions.value, ...actions }
  }

  provide('formId', id)

  // Check if a specific field is dirty
  function isFieldDirty(name) {
    const currentRaw = form.fieldValues.value[name]
    const current = isRef(currentRaw) ? unref(currentRaw) : currentRaw
    const initial = form.initialFieldValues.value[name]
    return !deepEqual(current, initial)
  }

  // Whether any field has been modified from initial values
  const dirty = computed(() => {
    return Object.keys(form.fieldValues.value).some(isFieldDirty)
  })

  // List of field names that have been modified
  const dirtyFields = computed(() => {
    return Object.keys(form.fieldValues.value).filter(isFieldDirty)
  })

  // Reset a field to its initial value
  function resetField(name) {
    form.fieldValues.value[name] = deepClone(
      form.initialFieldValues.value[name]
    )
  }

  // Reset all fields to initial values
  function resetForm() {
    form.fieldValues.value = deepClone(form.initialFieldValues.value)
  }

  // Mark current values as clean (update initial values to current)
  function markClean() {
    form.initialFieldValues.value = deepClone(form.fieldValues.value)
  }

  return {
    status: form.status,
    valid: form.valid,
    actions: form.actions,
    hooks: form.hooks,
    fieldValues: form.fieldValues,
    initialFieldValues: form.initialFieldValues,
    isFieldDirty,
    dirty,
    dirtyFields,
    resetField,
    resetForm,
    markClean
  }
}

export function useMangoField({ name, value }) {
  const formId = inject('formId')
  const form = forms[formId]

  if (!form) {
    throw new Error('useMangoField must be used within a form')
  }

  /*
		Parents will wrap their child values, so children should NOT provide their own values
	*/
  const parentField = inject('MangoField', undefined)
  if (!parentField) {
    form.fieldValues.value[name] = value
    // Store initial value for dirty tracking (only on first registration)
    if (!(name in form.initialFieldValues.value)) {
      form.initialFieldValues.value[name] = deepClone(value)
    }
  }

  // handle subfields/children
  provide('MangoField', true)
}
