import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { webReader } from "../libs/jina_reader";
import { createSuccessResponse, createErrorResponse } from "../libs/common_response";

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
      description: "The URL of the page to read",
    }),
});

const WebPageContentSchema = z
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
  .openapi("WebReaderResponseData");

const route = createRoute({
  method: "get",
  path: "/api/reader/{url}",
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
    const { url } = c.req.valid("param");
    if (!url) {
      return c.text("Please provide a URL");
    }
    try {
      const resp = await webReader(url);
      return c.json(
        createSuccessResponse({
          title: resp.data.title,
          url: resp.data.url,
          content: resp.data.content,
        }),
        200
      );
    } catch (error) {
      return c.json(createErrorResponse(500, "Failed to read the web page"), 500);
    }
  });
}
