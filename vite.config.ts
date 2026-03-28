import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'
// import react from '@vitejs/plugin-react' // インポートを追加

export default defineConfig({
  plugins: [cloudflare(), ssrPlugin(),
//    react() // プラグイン追加
 ]
})
