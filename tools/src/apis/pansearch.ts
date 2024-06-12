import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { search } from '../libs/pansearch';

// Define the schema for the request parameters
const PansearchRequestSchema = z.object({
  query: z.string().min(1, "Query is required")
});

// Define the schema for the response
const PansearchResponseSchema = z.array(z.any());

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
