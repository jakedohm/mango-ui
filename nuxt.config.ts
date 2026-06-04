import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Determine the Mango project root. When the UI runs from inside the package
// (node_modules/mango-cms/mango-ui), the CLI passes MANGO_PROJECT_ROOT so we can
// find the project's config. When ejected into the project, the parent dir works.
const projectRoot = process.env.MANGO_PROJECT_ROOT
  ? resolve(process.env.MANGO_PROJECT_ROOT)
  : resolve(__dirname, '..')

// Determine config path based on folder structure (mango/config or config/config)
let configPath: string

if (existsSync(resolve(projectRoot, 'mango/config/.collections.json'))) {
  configPath = resolve(projectRoot, 'mango/config')
} else if (existsSync(resolve(projectRoot, 'config/config/.collections.json'))) {
  configPath = resolve(projectRoot, 'config/config')
} else {
  throw new Error('Config folder not found. Expected mango/config or config/config with .collections.json')
}

const uiPort = process.env.MANGO_UI_PORT ? parseInt(process.env.MANGO_UI_PORT, 10) : 3001

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: { port: uiPort },
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
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@config': configPath,
        '@settings': resolve(configPath, 'settings.json'),
        '@collections': resolve(configPath, '.collections.json')
      }
    }
  }
})
