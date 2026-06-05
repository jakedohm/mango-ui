<script setup>
import { CheckIcon, XIcon, LoaderIcon, AlertTriangleIcon } from 'lucide-vue-next'

const props = defineProps({
  approvalId: { type: String, required: true }
})

const { getApproval, approve, reject } = useAssistant()
const entry = computed(() => getApproval(props.approvalId))
const proposal = computed(() => entry.value?.proposal)

const kindLabel = {
  update: 'Update',
  create: 'Create',
  delete: 'Delete',
  batch: 'Batch'
}

function changeEntries(p) {
  if (!p) return []
  if (p.kind === 'update') return Object.entries(p.changes || {})
  if (p.kind === 'create') return Object.entries(p.data || {})
  return []
}
</script>

<template>
  <div
    v-if="entry"
    class="rounded-lg border bg-card p-3 text-sm shadow-sm"
    :class="{
      'border-amber-300': entry.status === 'pending',
      'border-emerald-300 bg-emerald-50/40': entry.status === 'applied',
      'border-muted opacity-70': entry.status === 'rejected',
      'border-destructive': entry.status === 'error'
    }"
  >
    <div class="mb-2 flex items-center gap-2">
      <span
        class="rounded px-1.5 py-0.5 text-xs font-semibold"
        :class="proposal?.kind === 'delete' ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-800'"
      >
        {{ kindLabel[proposal?.kind] || proposal?.kind }}
      </span>
      <span class="font-medium">{{ proposal?.summary }}</span>
    </div>

    <!-- Field changes -->
    <div v-if="changeEntries(proposal).length" class="mb-2 space-y-1">
      <div
        v-for="[field, value] in changeEntries(proposal)"
        :key="field"
        class="flex gap-2 rounded bg-muted/50 px-2 py-1 font-mono text-xs"
      >
        <span class="shrink-0 text-muted-foreground">{{ field }}:</span>
        <span class="truncate">{{ typeof value === 'object' ? JSON.stringify(value) : value }}</span>
      </div>
    </div>

    <!-- Delete target -->
    <p v-if="proposal?.kind === 'delete'" class="mb-2 font-mono text-xs text-muted-foreground">
      id: {{ proposal.id }}
    </p>

    <!-- Batch list -->
    <ul v-if="proposal?.kind === 'batch'" class="mb-2 space-y-1">
      <li
        v-for="(op, i) in proposal.operations"
        :key="i"
        class="rounded bg-muted/50 px-2 py-1 text-xs"
      >
        <span class="font-semibold">{{ kindLabel[op.kind] }}</span> — {{ op.summary }}
      </li>
    </ul>

    <!-- Actions / status -->
    <div v-if="entry.status === 'pending'" class="flex gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:opacity-90"
        @click="approve(entry.id)"
      >
        <CheckIcon class="size-3.5" /> Approve
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
        @click="reject(entry.id)"
      >
        <XIcon class="size-3.5" /> Reject
      </button>
    </div>
    <p v-else-if="entry.status === 'applying'" class="flex items-center gap-1 text-xs text-muted-foreground">
      <LoaderIcon class="size-3.5 animate-spin" /> Applying…
    </p>
    <p v-else-if="entry.status === 'applied'" class="flex items-center gap-1 text-xs text-emerald-700">
      <CheckIcon class="size-3.5" /> Applied
    </p>
    <p v-else-if="entry.status === 'rejected'" class="text-xs text-muted-foreground">Rejected</p>
    <p v-else-if="entry.status === 'error'" class="flex items-center gap-1 text-xs text-destructive">
      <AlertTriangleIcon class="size-3.5" /> {{ entry.error }}
    </p>
  </div>
</template>
