<script setup>
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import 'vue-sonner/style.css'
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
    </div>
  </TooltipProvider>
</template>
