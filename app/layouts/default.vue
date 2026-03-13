<script setup>
import { toast } from 'vue-sonner'
import collections from '../../mango/config/.collections.json'
import { LogOutIcon, ChevronUp, User2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const router = useRouter()
const route = useRoute()
const { user, userInitials, fullName, logout: authLogout } = useAuth()

// Page transition loading indicator
const { isLoading, progress } = useLoadingIndicator({ throttle: 300 })

// Progress bar segments: top (0-30%), corner (30-40%), right (40-100%)
const topProgress = computed(() => Math.min(100, (progress.value / 30) * 100))
const cornerProgress = computed(() =>
  progress.value < 30 ? 0 : Math.min(100, ((progress.value - 30) / 10) * 100)
)
const rightProgress = computed(() =>
  progress.value < 40 ? 0 : ((progress.value - 40) / 60) * 100
)

const activeCollection = computed(() => {
  const path = route.path
  if (!path?.startsWith('/collections/')) return null
  const segments = path.split('/')
  return segments[2] || null
})

async function logout() {
  await authLogout()
  router.push('/login')

  toast.success('Logged out', {
    duration: 4000,
    description: `Y'all come back now, ya hear?`
  })
}
</script>

<template>
  <div class="flex h-screen items-start">
    <!-- Left column: header + sidebar -->
    <div class="flex flex-col h-full overflow-y-scroll min-w-72">
      <!-- Header with logo -->
      <div class="px-4 h-24 flex items-center shrink-0">
        <NuxtLink to="/">
          <Logo />
        </NuxtLink>
      </div>

      <!-- Sidebar in rounded container (use theme so hover/active match docs) -->
      <SidebarProvider class="!min-h-auto flex-grow">
        <Sidebar
          variant="sidebar"
          collapsible="none"
          class="!relative !h-full flex-1 rounded-tr-xl border-t-1 border-r-1 border-sidebar-border py-3"
        >
          <!-- Page transition indicator - traces the border -->
          <div
            class="absolute inset-0 pointer-events-none transition-opacity duration-300"
            :class="isLoading ? 'opacity-100' : 'opacity-0'"
          >
            <!-- Top edge -->
            <div
              class="absolute -top-px left-0 h-0.5 bg-emerald-500 rounded-r-full transition-[width] duration-100 ease-out"
              :style="{
                width: `calc(${topProgress}% - ${topProgress === 100 ? '10px' : '0px'})`
              }"
            />
            <!-- Corner arc -->
            <svg
              class="absolute -top-px -right-px"
              width="14"
              height="14"
              viewBox="0 0 14 14"
            >
              <path
                d="M 0,1 L 1,1 Q 13,1 13,13 L 13,14"
                fill="none"
                stroke="#10b981"
                stroke-width="2"
                stroke-linecap="round"
                pathLength="100"
                stroke-dasharray="100"
                :stroke-dashoffset="100 - cornerProgress"
                class="transition-[stroke-dashoffset] duration-75 ease-out"
              />
            </svg>
            <!-- Right edge -->
            <div
              class="absolute top-[11px] -right-px w-0.5 bg-emerald-500 rounded-b-full transition-[height] duration-150 ease-out"
              :style="{
                height: `calc(${rightProgress}% - ${rightProgress > 0 ? '11px' : '0px'})`
              }"
            />
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Collections</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem
                    v-for="collection in collections"
                    :key="collection.name"
                  >
                    <SidebarMenuButton
                      as-child
                      :is-active="activeCollection === collection.name"
                    >
                      <NuxtLink
                        class="text-sm"
                        :to="`/collections/${collection.name}`"
                      >
                        {{ collection.titleName }}
                      </NuxtLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter v-if="user">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <SidebarMenuButton
                      size="lg"
                      class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <div
                        class="flex items-center justify-center size-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium"
                      >
                        {{ userInitials }}
                      </div>
                      <div class="grid flex-1 text-left text-sm leading-tight">
                        <span class="truncate font-semibold">{{
                          fullName || 'User'
                        }}</span>
                        <span class="truncate text-xs text-muted-foreground">{{
                          user.email
                        }}</span>
                      </div>
                      <ChevronUp class="ml-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top-end"
                    class="w-[--reka-dropdown-menu-trigger-width]"
                  >
                    <DropdownMenuItem as-child>
                      <NuxtLink :to="`/collections/members/${user.id}`">
                        <User2 class="mr-2 size-4" />
                        Profile
                      </NuxtLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="logout">
                      <LogOutIcon class="mr-2 size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </div>

    <div class="flex-grow max-h-full overflow-y-scroll">
      <slot />
    </div>
  </div>
</template>
