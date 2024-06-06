import { createRoute, z } from "@hono/zod-openapi";
import { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { webSummary } from "../libs/web_summary";

const ParamsSchema = z.object({
  url: z
    .string()
    .min(5)
    .openapi({
      param: {
        name: "url",
        in: "path",
      },
      example: "https://example.com",
      description: "The URL of the page to summarize",
    }),
});

const route = createRoute({
  method: "get",
  path: "/api/summary/{url}",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
        "event-stream": {
          schema: z.string(),
        },
      },
      description: "Returns a summary of a web page",
    },
  },
});

async function handle_summary(c: Context) {
  const url = c.req.param("url");
  const resp = await webSummary(url, null);
  const reader = resp.body.getReader();

  if (c.req.header("accept") === "text/event-stream") {
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

export function register_summary_route(app: any) {
  app.openapi(route, handle_summary);
}
