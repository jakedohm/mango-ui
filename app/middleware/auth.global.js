export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login page
  if (to.path === '/login') {
    return
  }

  const { isAuthenticated, fetchUser, user } = useAuth()

  // If we don't have user data yet, try to fetch from session
  // This handles page refresh scenarios
  if (!user.value) {
    await fetchUser()
  }

  // If still not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
