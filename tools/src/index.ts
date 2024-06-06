import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { register_reader_route } from "./apis/reader";
import { register_summary_route } from "./apis/summary";

type Bindings = {
  API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// set global middlewares
// Bearer Auth Middleware
app.use("/api/*", async (c, next) => {
  const auth = bearerAuth({
    token: c.env.API_TOKEN,
  });
  return auth(c, next);
});

// The OpenAPI documentation will be available at /doc
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

// Register the security scheme: Bearer
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

// The Swagger UI will be available at /ui
app.get(
  "/ui",
  swaggerUI({
    url: "/doc",
  })
);

// register routes
register_reader_route(app);
register_summary_route(app);

app.get("/", async (c) => {
  return c.redirect("/ui")
})

export default app;
