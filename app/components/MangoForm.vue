<script setup>
import { ref, reactive } from 'vue'
import { Mango } from '../helpers/mango.js'
import { useForm } from './MangoForms.js'
import { toast } from 'vue-sonner'

const STATUSES = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
}

const props = defineProps({
  collection: { type: String, required: true },
  id: { type: String }
})
const emit = defineEmits(['update:form'])

const errors = reactive({
  form: null,
  fields: null
})

const wait = (length) => new Promise((resolve) => setTimeout(resolve, length))

const MIN_LOADING_TIME = 400

function deepUnref(obj) {
  if (isRef(obj)) return unref(obj)
  if (Array.isArray(obj)) return obj.map(deepUnref)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, deepUnref(v)])
    )
  }
  return obj
}

async function handleSubmit() {
  const target = document.getElementById(props.id)

  const fields = deepUnref(fieldValues.value)
  const validFields = fields

  // Adding an "id" field will prompt the Mango backend to perform an update instead of create
  if (props.id && props.id !== 'new') {
    validFields.id = props.id
  }

  status.value = STATUSES.PENDING

  try {
    // Run API call and minimum delay in parallel to prevent spinner flash
    const [doc] = await Promise.all([
      Mango[props.collection].save(validFields),
      wait(MIN_LOADING_TIME)
    ])
    status.value = STATUSES.SUCCESS

    // Mark form as clean after successful save
    markClean()

    // Call onSuccess hook if provided
    if (hooks.onSuccess) {
      console.log('Form submitted successfully:', doc)
      hooks.onSuccess(doc)
      toast.success('Document updated successfully', {
        richColors: true,
        duration: 5000
      })
    }

    // Clear fields errors
    errors.fields = null
    errors.form = null
  } catch (error) {
    status.value = STATUSES.ERROR

    const formError =
      error.response?.data?.response || 'An unknown error occurred'

    errors.fields = error.response?.data?.fieldErrors || null
    errors.form = formError || null

    toast.error('Failed to Submit', {
      description: formError,
      richColors: true,
      duration: 5000
    })

    throw error
  }
}

const MangoForm = useForm(props.id, {
  actions: { submit: handleSubmit }
})
const {
  status,
  valid,
  hooks,
  fieldValues,
  isFieldDirty,
  dirty,
  dirtyFields,
  resetField,
  resetForm,
  markClean
} = MangoForm

const form = reactive({
  fields: {}
})
provide('mangoForm', {
  form: {
    status,
    errors
  },
  methods: {
    registerField(name, value) {
      form.fields[name] = { value: value }
    },
    updateFieldValue(name, value) {
      form.fields[name].value = value
    },
    setFieldValid(name, isValid) {
      // TODO: Implement field validation status setting
      form.fields[name].valid = isValid
    },
    isFieldDirty,
    resetField
  }
})

const formValid = computed(() => {
  const invalid = Object.values(form.fields).filter(
    (field) => field.valid.valid === false
  )
  return invalid.length === 0
})
</script>

<template>
  <form :id="id" @submit.prevent="handleSubmit">
    <slot
      :status="status"
      :errors="errors"
      :valid="formValid"
      :dirty="dirty"
      :dirtyFields="dirtyFields"
      :resetForm="resetForm"
    />

    <!-- <pre
      class="fixed bottom-0 right-0 bg-white p-4 z-10 w-1/4 h-3/4 shadow overflow-y-scroll"
      >{{ MangoForm }}</pre
    > -->
  </form>
</template>
