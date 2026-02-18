<script setup>
import { ref, onMounted, useTemplateRef } from 'vue'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: false
})

useHead({
  title: 'Log in – Mango'
})
useSeoMeta({
  description:
    'Sign in to Mango with your email and password to manage content and collections.'
})

const { login, isLoading } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const loginButton = useTemplateRef('login-button')
const config = useRuntimeConfig()

const autoLoginUsername = config.public.autoLoginUsername?.trim()
const autoLoginPassword = config.public.autoLoginPassword?.trim()
const shouldAutofill = Boolean(autoLoginUsername && autoLoginPassword)

if (shouldAutofill) {
  email.value = autoLoginUsername
  password.value = autoLoginPassword
}

onMounted(() => {
  if (shouldAutofill) {
    const el = loginButton.value?.$el ?? loginButton.value
    el?.focus?.()
  }
})

async function handleSubmit(e) {
  e?.preventDefault()

  if (!email.value || !password.value) {
    toast.error('Please enter your email and password')
    return
  }

  const result = await login(email.value, password.value)

  if (result.success) {
    toast.success('Welcome back!', {
      description: `Logged in as ${result.user.firstName || result.user.email}`
    })
    router.push('/')
  } else {
    toast.error('Login failed', {
      description: result.error || 'Invalid email or password'
    })
  }
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gray-50"
  >
    <Logo />

    <Card class="mt-6 w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-gray-900">Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit="handleSubmit">
          <div class="grid w-full items-center gap-4">
            <div class="flex flex-col space-y-1.5">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="gru@despicable.me"
                :disabled="isLoading"
              />
            </div>
            <div class="relative flex flex-col space-y-2 py-3">
              <Label for="password">Password</Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                :disabled="isLoading"
              />
              <Button
                variant="link"
                href="#"
                class="absolute top-0 right-0 pr-1 text-amber-800"
              >
                Forgot your password?
              </Button>
            </div>
          </div>
          <Button
            ref="login-button"
            type="submit"
            class="w-full mt-6 bg-emerald-600 hover:bg-emerald-800"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Logging in...</span>
            <span v-else>Login</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
