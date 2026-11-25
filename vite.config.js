import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const base = process.env.SITE_URL
  ? `${new URL(process.env.SITE_URL).pathname.replace(/\/$/, '')}/`
  : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rolldownOptions: {
      // Two pages: the business calculator and the autonomous-work calculator.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        autonomo: fileURLToPath(new URL('./autonomo/index.html', import.meta.url)),
      },
      output: {
        // React and the JSON database change at different paces from the app code: separate
        // chunks keep them cached across deploys and the entry chunk under the size warning.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/]react(-dom)?[\\/]|node_modules[\\/]scheduler[\\/]/ },
            { name: 'db-autonomo', test: /[\\/]src[\\/]db[\\/]autonomo[\\/]/, priority: 2 },
            { name: 'db', test: /[\\/]src[\\/]db[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
})
