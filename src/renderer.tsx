import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children, title }: { children?: any, title?: string }) => {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || '7 Habits App'}</title>
        
        {/* Tailwind CSS を有効化 */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body className="bg-gray-100">
        {children}
      </body>
    </html>
  )
})
