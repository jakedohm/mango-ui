import DefaultFieldComponent from '~/components/listing/default.vue'
const FieldComponents = import.meta.glob('./*.vue')

const componentCache = new Map()

const customMap = {
  title: 'title',
  created: 'timestamp'
}

function getType(field) {
  if (customMap[field.name]) {
    return customMap[field.name]
  }

  if (field.instanceOf) {
    return field.instanceOf
  }

  if (field.type === 'DateTime') {
    return 'timestamp'
  }

  return 'default'
}

export function ListingFieldRenderer(props, context) {
  const type = getType(props.field)

  const key = `./${type}.vue`

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
