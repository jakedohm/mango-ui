import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: { port: 3001 },
  modules: ['shadcn-nuxt'],
  shadcn: {
    prefix: '',
    componentDir: '~/components/ui'
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      ignore: ['~/components/ui/', '~/components/fields/']
    }
  ],
  css: ['./app/assets/css/tailwind.css'],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: true
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap'
        },
        { rel: 'icon', type: 'image/png', href: '/favicon/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/favicon/site.webmanifest' }
      ],
      meta: [
        { name: 'apple-mobile-web-app-title', content: 'Mango' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      autoLoginUsername: process.env.AUTO_LOGIN_USERNAME ?? '',
      autoLoginPassword: process.env.AUTO_LOGIN_PASSWORD ?? ''
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
})
