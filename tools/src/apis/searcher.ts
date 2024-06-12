import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { webSearcher } from "../libs/jina_reader";

const InputSchema = z.object({
  query: z
    .string()
    .min(5)
    .openapi({
      param: {
        name: "query",
        in: "path",
      },
      example: "how to build a website",
      description: "The query to search for",
    }),
});

const ResponseSchema = z
  .array(
    z.object({
      title: z.string().openapi({
        example: "Example Page Title",
      }),
      url: z.string().openapi({
        example: "https://example.com",
      }),
      content: z.string().openapi({
        example: "This is the content of the page",
      }),
      description: z.string().openapi({
        example: "This is the description of the page",
    }),
  })
  .openapi("WebSearchResponseData"));

const route = createRoute({
  method: "get",
  path: "/api/searcher/{query}",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: InputSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Returns the content of a web page",
    },
  },
});

export function register_searcher_route(app: OpenAPIHono<any>) {
  app.openapi(route, async (c) => {
    const { query } = c.req.valid("param");
    if (!query) {
      return c.text("Please provide a URL");
    }
    const searchResponse = await webSearcher(query);
    return c.json(searchResponse, 200);
  });
}
