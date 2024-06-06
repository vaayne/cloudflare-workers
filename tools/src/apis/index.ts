import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const route = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Returns the content of a web page",
    },
  },
});

export function register_index_route(app: OpenAPIHono<any>) {
  app.openapi(route, async (c) => {
    return c.text("Hello Hono!", 200);
  });
}
