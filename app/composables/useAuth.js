import { api } from '../helpers/mango.js'

export const useAuth = () => {
  const user = useState('auth-user', () => null)
  const isAuthenticated = computed(() => !!user.value)
  const isLoading = useState('auth-loading', () => false)
  const error = useState('auth-error', () => null)

  /**
   * Login with email and password
   */
  async function login(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch(`${api}/endpoints/auth/login`, {
        method: 'POST',
        body: { email, password },
        credentials: 'include'
      })

      if (response.success) {
        user.value = response.user
        return { success: true, user: response.user }
      } else {
        error.value = response.error || 'Login failed'
        return { success: false, error: error.value }
      }
    } catch (e) {
      error.value = e.data?.error || e.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout and clear session
   */
  async function logout() {
    isLoading.value = true

    try {
      await $fetch(`${api}/endpoints/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (e) {
      // Even if logout fails, clear local state
      console.error('Logout error:', e)
    } finally {
      user.value = null
      isLoading.value = false
    }
  }

  /**
   * Fetch current user from session (for page refresh)
   */
  async function fetchUser() {
    isLoading.value = true

    try {
      // Get cookies from the request headers during SSR
      const headers = {}
      if (import.meta.server) {
        const event = useRequestEvent()
        const cookie = event?.node?.req?.headers?.cookie
        if (cookie) {
          headers.cookie = cookie
        }
      }

      const response = await $fetch(`${api}/endpoints/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers
      })

      if (response.success && response.authenticated) {
        user.value = response.user
        return { success: true, user: response.user }
      } else {
        user.value = null
        return { success: false, authenticated: false }
      }
    } catch (e) {
      user.value = null
      return { success: false, error: e.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get user initials for avatar
   */
  const userInitials = computed(() => {
    if (!user.value) return ''
    const first = user.value.firstName?.[0] || ''
    const last = user.value.lastName?.[0] || ''
    return (first + last).toUpperCase()
  })

  /**
   * Get first name
   */
  const firstName = computed(() => {
    return user.value?.firstName || ''
  })

  /**
   * Get full name
   */
  const fullName = computed(() => {
    if (!user.value) return ''
    return [user.value.firstName, user.value.lastName].filter(Boolean).join(' ')
  })

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    fetchUser,
    userInitials,
    firstName,
    fullName
  }
}
