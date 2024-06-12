import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { search } from '../libs/pansearch';

const PansearchRequestSchema = z.object({
  query: z
    .string()
    .min(1)
    .openapi({ example: "sample query", description: "Search query" })
    .openapi({
      param: {
        name: "query",
        in: "query",
      },
    }),
});

const SearchDataSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  content: z.string().openapi({ example: "sample content" }),
  pan: z.string().openapi({ example: "aliyundrive" }),
  image: z.string().openapi({ example: "https://example.com/image.jpg" }),
  time: z.string().openapi({ example: "2023-10-01T12:00:00Z" }),
});

const PansearchResponseSchema = z.object({
  results: z.array(SearchDataSchema).openapi({
    example: [
      {
        id: 1,
        content: "sample content",
        pan: "aliyundrive",
        image: "https://example.com/image.jpg",
        time: "2023-10-01T12:00:00Z",
      },
    ],
  }),
}).openapi("PansearchResponse");

/**
 * Registers the pansearch route with the provided app.
 * @param {OpenAPIHono<any>} app - The Hono app instance
 */
const route = createRoute({
  method: "get",
  path: "/api/pansearch",
  request: {
    query: PansearchRequestSchema,
  },
  responses: {
    200: {
      description: "The search results",
      content: {
        "application/json": {
          schema: PansearchResponseSchema,
        },
      },
    },
  },
});

export function registerPansearchRoute(app: OpenAPIHono<any>) {
  app.openapi(route, async (c) => {
    const { query } = c.req.valid("query");
    if (!query) {
      return c.text("Please provide a search query", 400);
    }
    try {
      const results = await search(query);
      return c.json({ results }, 200);
    } catch (error) {
      console.error("Search failed:", error);
      return c.text("Search failed", 500);
    }
  });
}
