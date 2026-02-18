import DefaultFieldComponent from '~/components/fields/default.vue'
const FieldComponents = import.meta.glob('./*.vue')

// Cache async components to prevent remounting on every render
const componentCache = new Map()

function getType(field) {
  const customMap = {
    email: 'email',
    password: 'password',
    title: 'plainText',
    firstName: 'plainText',
    lastName: 'plainText',
    meta: 'json'
  }

  if (customMap[field.name]) {
    return customMap[field.name]
  }

  if (field.array) {
    return 'repeatable'
  }

  if (field.instanceOf) {
    return field.instanceOf
  }

  if (field.complex && field.fields?.length) {
    return 'fieldGroup'
  }

  if (field.inputType === 'String' || field.type === 'String') {
    return 'plainText'
  }

  if (field.type === 'Boolean') {
    return 'toggle'
  }

  if (field.type === 'DateTime') {
    return 'timestamp'
  }

  return 'default'
}

export function MangoFieldRenderer(props, context) {
  const type = getType(props.field)

  const key = `./${type}.vue`

  // Get or create cached async component
  let Component
  if (type && FieldComponents[key]) {
    if (!componentCache.has(key)) {
      componentCache.set(key, defineAsyncComponent(FieldComponents[key]))
    }
    Component = componentCache.get(key)
  } else {
    Component = DefaultFieldComponent
  }

  return h(
    Component,
    {
      ...context.attrs,
      ...props
    },
    context.slots
  )
}
