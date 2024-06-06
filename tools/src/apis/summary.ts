import { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { webSummary } from "../libs/web_summary";

export async function handle_summary(c: Context) {
  const url = c.req.param("url");
  console.log(`summary url: ${url}`);
  const resp = await webSummary(url, null);
  const reader = resp.body.getReader();

  if (c.req.header("accept") === "event-stream") {
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
          });
        }
      }
    });
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

  return c.text(text);
}
