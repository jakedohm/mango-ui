<template>
  <div class="flex shadow-xs rounded-md" :class="{ 'flex-col': !simple }">
    <editor-content
      class="relative z-10 bg-white placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-3 text-base transition-[color,box-shadow] outline-none focus-within:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ring-[3px] ring-transparent"
      :class="error ? 'border-destructive/40 ring-destructive/20 dark:ring-destructive/40' : 'border-input'"
      :editor="editor"
    />
    <div
      class="bg-gray-50 border border-input"
      :class="[
        simple
          ? 'w-14 ml-[-12px] pl-[12px] rounded-r-md border-l-0'
          : 'h-16 mt-[-12px] pt-[12px] rounded-b-md border-t-0'
      ]"
    >
      <div v-if="isLinkOpen" class="flex items-center gap-2 pt-2 px-1.5">
        <Input
          class="h-8"
          type="text"
          id="tiptap-link-input"
          v-model="linkInput"
          placeholder="Enter a URL"
        />
        <Button type="button" variant="outline" size="sm" @click="addLink">
          Add Link
        </Button>
        <Button
          @click="isLinkOpen = false"
          type="button"
          variant="outline"
          size="sm"
        >
          Close
        </Button>
      </div>
      <div
        v-else
        class="flex justify-start items-center h-full gap-1.5 overflow-scroll p-1.5"
        :class="[simple ? 'flex-col' : 'px-2']"
      >
        <template v-for="(group, index) in actionBar">
          <Separator
            v-if="index !== 0 && !simple"
            class="!h-5 mx-1"
            orientation="vertical"
          />

          <template v-if="index !== 0 || (index === 0 && !simple)">
            <template v-for="action in group" :key="action.id">
              <template v-if="action.dropdown">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      class="size-6"
                      :class="{
                        'text-amber-600 border-amber-300': editor?.isActive(
                          action.id
                        )
                      }"
                    >
                      <component
                        :is="action.icon.value || action.icon"
                        class="!size-3.5"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent class="w-56" align="start">
                    <template v-for="(group, i) in action.dropdown" :key="i">
                      <DropdownMenuLabel>{{ group.heading }}</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          v-for="dropdownAction in group.actions"
                          :key="dropdownAction.id"
                          @click="actions[action.id](dropdownAction)"
                          :class="{
                            '!text-amber-700': editor?.isActive(
                              action.id,
                              dropdownAction.props
                            )
                          }"
                        >
                          {{ dropdownAction.label }}
                          <CheckIcon
                            :class="[
                              editor?.isActive(action.id, dropdownAction.props)
                                ? 'opacity-100'
                                : 'opacity-0'
                            ]"
                          />
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </template>
                  </DropdownMenuContent>
                </DropdownMenu>
              </template>
              <template v-else>
                <Button
                  @click="actions[action.id](action)"
                  type="button"
                  variant="outline"
                  size="icon"
                  class="size-6"
                  :class="{
                    'text-amber-600 border-amber-300': editor?.isActive(
                      action.id
                    )
                  }"
                >
                  <component
                    :is="action.icon.value || action.icon"
                    class="!size-3.5"
                  />
                </Button>
              </template>
            </template>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  QuoteIcon,
  ListIcon,
  ListOrderedIcon,
  HeadingIcon,
  LinkIcon,
  UnderlineIcon,
  CheckIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps({
  error: Object
})

const simple = ref(false)
const model = defineModel('model-value', { type: String })

const actionBar = [
  [
    {
      id: 'bold',
      label: 'Bold',
      icon: BoldIcon
    },
    {
      id: 'italic',
      label: 'Italic',
      icon: ItalicIcon
    },
    {
      id: 'strike',
      label: 'Strikethrough',
      icon: StrikethroughIcon
    },
    {
      id: 'underline',
      label: 'Underline',
      icon: UnderlineIcon
    }
  ],
  [
    {
      id: 'blockquote',
      label: 'Blockquote',
      icon: QuoteIcon
    },
    {
      id: 'bulletList',
      label: 'Bullet List',
      icon: ListIcon
    },
    {
      id: 'orderedList',
      label: 'Ordered List',
      icon: ListOrderedIcon
    }
  ],
  [
    {
      id: 'link',
      label: 'Link',
      icon: LinkIcon
    },
    {
      id: 'heading',
      label: 'Heading',
      icon: computed(() => {
        const headingActive = editor.value?.isActive('heading')
        if (!headingActive) {
          return HeadingIcon
        } else if (editor.value?.isActive('heading', { level: 1 })) {
          return Heading1Icon
        } else if (editor.value?.isActive('heading', { level: 2 })) {
          return Heading2Icon
        } else if (editor.value?.isActive('heading', { level: 3 })) {
          return Heading3Icon
        } else if (editor.value?.isActive('heading', { level: 4 })) {
          return Heading4Icon
        } else if (editor.value?.isActive('heading', { level: 5 })) {
          return Heading5Icon
        } else if (editor.value?.isActive('heading', { level: 6 })) {
          return Heading6Icon
        }
      }),
      dropdown: [
        {
          heading: 'Headings',
          actions: [
            { id: 'h1', label: 'Heading 1', props: { level: 1 } },
            { id: 'h2', label: 'Heading 2', props: { level: 2 } },
            { id: 'h3', label: 'Heading 3', props: { level: 3 } },
            { id: 'h4', label: 'Heading 4', props: { level: 4 } },
            { id: 'h5', label: 'Heading 5', props: { level: 5 } },
            { id: 'h6', label: 'Heading 6', props: { level: 6 } }
          ]
        }
      ]
    }
  ]
]

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      trailingNode: false
    })
  ],
  content: model.value,
  onUpdate() {
    console.log(editor.value.getHTML())
    model.value = editor.value.getHTML()
  }
})

const actions = {
  bold: () => editor.value.chain().focus().toggleBold().run(),
  italic: () => editor.value.chain().focus().toggleItalic().run(),
  strike: () => editor.value.chain().focus().toggleStrike().run(),
  underline: () => editor.value.chain().focus().toggleUnderline().run(),
  blockquote: () => editor.value.chain().focus().toggleBlockquote().run(),
  bulletList: () => editor.value.chain().focus().toggleBulletList().run(),
  orderedList: () => editor.value.chain().focus().toggleOrderedList().run(),
  heading: ({ props }) => {
    editor.value.chain().focus().toggleHeading(props).run()
  },
  link: ({ props }) => {
    if (editor.value.isActive('link')) {
      editor.value.chain().focus().toggleLink().run()
    } else {
      isLinkOpen.value = true
      nextTick(() => {
        document.getElementById('tiptap-link-input').focus()
      })
    }
  }
}

const isLinkOpen = ref(false)
const linkInput = ref('')
function addLink() {
  if (!isUrlValid(linkInput.value)) {
    toast.error('Please enter a valid URL.')
    return
  }

  editor.value.chain().focus().toggleLink({ href: linkInput.value }).run()
  isLinkOpen.value = false
}

/* Helper Functions */
function isUrlValid(string) {
  try {
    new URL(string)
    return true
  } catch (err) {
    return false
  }
}
</script>

<style>
@reference "~/assets/css/tailwind.css";

.tiptap {
  width: 100%;
  outline: none;
}

/* Spacing between elements */
.tiptap *:first-child {
  @apply mt-0;
}
.tiptap *:last-child {
  @apply mb-0;
}

/* Selection */
.tiptap::selection {
  @apply bg-amber-200;
}

/* Paragraph */
.tiptap p {
  @apply my-3;
}

/* Headings */

.tiptap :is(h1, h2, h3, h4, h5, h6) {
  position: relative;
  font-weight: 500;
}

.tiptap h1 {
  font-size: 1.25em;
}
.tiptap h2 {
  font-size: 1.2em;
}
.tiptap h3 {
  font-size: 1.15em;
}
.tiptap h4 {
  font-size: 1.1em;
}
.tiptap h5 {
  font-size: 1.05em;
}
.tiptap h6 {
  font-size: 1em;
}

/* Blockquote */

.tiptap blockquote {
  @apply my-4 border-l-[1.5px] border-gray-300 pl-2 py-1 italic;
}

/* Lists, Generic */
.tiptap ul,
ol {
  @apply my-4;
}

.tiptap li {
  margin-left: 12px;
  padding-left: 1px;
  @apply list-disc;

  &::marker {
    @apply text-gray-500;
  }

  & + li {
    @apply mt-1.5;
  }
}

/* Lists, Unordered */

.tiptap ul li {
  @apply list-disc;

  &::marker {
    font-size: 12px;
  }
}

/* Lists, Ordered */

.tiptap ol li {
  @apply list-decimal;

  &::marker {
    font-size: 13px;
  }
}

/* Links */
.tiptap a {
  @apply text-amber-600 underline underline-offset-3 decoration-amber-300;
}
</style>
