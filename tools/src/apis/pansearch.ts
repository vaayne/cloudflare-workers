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

const PansearchResponseSchema = z
  .object({
    results: z.array(z.any()).openapi({
      example: [{ id: 1, value: "sample result" }],
    }),
  })
  .openapi("PansearchResponse");

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
