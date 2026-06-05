<script setup>
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import 'vue-sonner/style.css'

const route = useRoute()
const { isAuthenticated } = useAuth()
// Hide the assistant on the login screen / when signed out.
const showAssistant = computed(
  () => isAuthenticated.value && route.path !== '/login'
)
</script>

<template>
  <TooltipProvider>
    <div class="h-screen bg-white">
      <NuxtRouteAnnouncer />

      <NuxtLayout>
        <NuxtPage :page-key="$route.fullPath" />
      </NuxtLayout>

      <Toaster />

      <CommandPalette />

      <ClientOnly>
        <AssistantDock v-if="showAssistant" />
      </ClientOnly>
    </div>
  </TooltipProvider>
</template>
