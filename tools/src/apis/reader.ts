import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createErrorResponse, createSuccessResponse } from "../libs/common_response";
import { webReader } from "../libs/jina_reader";

const ParamsSchema = z.object({
  url: z
    .string()
    .min(5)
    .openapi({
      param: {
        name: "url",
        in: "query",
      },
      example: "https://example.com",
      description: "URL to retrieve content from.",
    }),
});

const WebPageContentSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z
    .object({
      title: z.string().openapi({
        example: "Example Page Title",
      }),
      url: z.string().openapi({
        example: "https://example.com",
      }),
      content: z.string().openapi({
        example: "This is the content of the page",
      }),
    })
    .optional()
    .openapi("WebReaderResponseData"),
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
  path: "/api/reader",
  description: "Retrieve LLM-friendly content from a URL.",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    query: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: WebPageContentSchema,
        },
      },
      description: "Returns the content of a web page",
    },
  },
});

export function register_reader_route(app: OpenAPIHono<any>) {
  app.openapi(route, async (c) => {
    const { url } = c.req.valid("query");
    if (!url) {
      return c.text("Please provide a URL");
    }
    try {
      const resp = await webReader(url);
      return c.json(
        createSuccessResponse(resp),
        200
      );
    } catch (error) {
      return c.json(createErrorResponse(500, `Failed to read the web page: ${error}`), 500);
    }
  });
}
