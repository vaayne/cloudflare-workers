import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { webSummary } from './web_summary'


const app = new Hono()
type Bindings = {
  SECRET_KEY: string
}


app.get('/summary/:url', async (c) => {
  const url = c.req.param('url')
  console.log(`summary url: ${url}`)
  const resp = await webSummary(url, null)
  const reader = resp.body.getReader();

  if (c.req.header('accept') === 'event-stream') {
    return streamSSE(c, async (stream) => {
      let result;
      const decoder = new TextDecoder("utf-8");
      const regex = /0:"([^"]*)"/g;
    
      while (!(result && result.done)) {
        result = await reader.read();
        const chunk = decoder.decode(result.value || new Uint8Array(), {
          stream: !result.done,
        });
        let match;
        while ((match = regex.exec(chunk)) !== null) {
          await stream.writeSSE({
            data: match[1].replace(/\\n/g, "\n"),
          })
        }
      } 
    })
  }


  let text = "";
  let result;
  const decoder = new TextDecoder("utf-8");
  const regex = /0:"([^"]*)"/g;

  while (!(result && result.done)) {
    result = await reader.read();
    const chunk = decoder.decode(result.value || new Uint8Array(), {
      stream: !result.done,
    });
    let match;
    while ((match = regex.exec(chunk)) !== null) {
      text += match[1].replace(/\\n/g, "\n");
    }
  }


  return c.text(text)
})

app.get('/env', (c) => {
  const SECRET_KEY = c.env.SECRET_KEY
  return c.text(SECRET_KEY)
})


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
