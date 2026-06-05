import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'fs'
import { resolve, sep } from 'path'

// Check a single directory for a Mango config (new mango/config or legacy config/config).
function configAt(dir: string): string | null {
  if (existsSync(resolve(dir, 'mango/config/.collections.json'))) return resolve(dir, 'mango/config')
  if (existsSync(resolve(dir, 'config/config/.collections.json'))) return resolve(dir, 'config/config')
  return null
}

// Resolve the Mango project config across the ways the UI can run. Order matters:
//   1. MANGO_PROJECT_ROOT — authoritative hint the CLI passes for dev/build/etc.
//   2. node_modules boundary — when bundled at <project>/node_modules/mango-cms/mango-ui,
//      the project root is the dir that contains node_modules. This is the case that
//      fails during `npm install` (postinstall: nuxt prepare), where the CLI's env is
//      not propagated to the spawned install.
//   3. parent dir — when ejected at <project>/mango-ui (or running in-repo).
// Deterministic lookups only (no unbounded walk-up), so a missing project config can't
// accidentally resolve to a stray config elsewhere on the machine.
const candidates: string[] = []
if (process.env.MANGO_PROJECT_ROOT) candidates.push(resolve(process.env.MANGO_PROJECT_ROOT))
const parts = __dirname.split(sep)
const nmIdx = parts.lastIndexOf('node_modules')
if (nmIdx > 0) candidates.push(parts.slice(0, nmIdx).join(sep))
candidates.push(resolve(__dirname, '..'))

let configPath: string | null = null
for (const dir of candidates) {
  configPath = configAt(dir)
  if (configPath) break
}

if (!configPath) {
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
    // Server-only — never exposed to the client.
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    public: {
      autoLoginUsername: process.env.AUTO_LOGIN_USERNAME ?? '',
      autoLoginPassword: process.env.AUTO_LOGIN_PASSWORD ?? '',
      // AI assistant models (overridable per instance).
      assistantModel: process.env.MANGO_ASSISTANT_MODEL ?? 'gpt-4.1',
      assistantRealtimeModel:
        process.env.MANGO_ASSISTANT_REALTIME_MODEL ?? 'gpt-realtime-2'
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
