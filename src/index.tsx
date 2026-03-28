import { Hono } from 'hono'
import { renderer } from './renderer'
import { App } from './App' // 作成したコンポーネントをインポートする

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<App />)// c.render の中に App を入れた
})

export default app
