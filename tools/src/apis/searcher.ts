import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { webSearcher } from "../libs/jina_reader";
import { createSuccessResponse, createErrorResponse } from "../libs/common_response";

const InputSchema = z.object({
  query: z
    .string()
    .min(5)
    .openapi({
      param: {
        name: "query",
        in: "query",
      },
      example: "how to build a website",
      description: "The query to search for",
    }),
});

const ResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z
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
    )
    .optional()
    .openapi("WebSearchResponseData"),
  errors: z
    .array(
      z.object({
        code: z.number().openapi({ example: 500 }),
        message: z.string().openapi({ example: "error messages" }),
      })
    )
    .openapi("ErrorResponse"),
});

const route = createRoute({
  method: "get",
  path: "/api/searcher",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    query: InputSchema,
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
    const { query } = c.req.valid("query");
    if (!query) {
      return c.text("Please provide a URL");
    }
    const searchResponse = await webSearcher(query);
    try {
      const searchResponse = await webSearcher(query);
      return c.json(createSuccessResponse(searchResponse), 200);
    } catch (error) {
      return c.json(createErrorResponse(500, "Search failed"), 500);
    }
  });
}
