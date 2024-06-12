import { OpenAPIHono } from 'hono-openapi';
import { z } from 'zod';
import { search } from '../libs/pansearch';

// Define the schema for the request parameters
const PansearchRequestSchema = z.object({
  query: z.string().min(1, "Query is required")
});

// Define the schema for the response
const PansearchResponseSchema = z.array(z.any());

/**
 * Registers the pansearch route with the provided app.
 * @param {OpenAPIHono<any>} app - The Hono app instance.
 */
export function register_pansearch_route(app: OpenAPIHono<any>) {
  app.get(
    '/pansearch',
    {
      schema: {
        query: PansearchRequestSchema,
        response: PansearchResponseSchema
      }
    },
    async (c) => {
      const { query } = c.req.valid("query");
      if (!query) {
        return c.text("Please provide a search query", 400);
      }
      try {
        const results = await search(query);
        return c.json(results, 200);
      } catch (error) {
        console.error("Search failed:", error);
        return c.text("Search failed", 500);
      }
    }
  );
}
