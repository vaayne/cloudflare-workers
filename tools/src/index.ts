import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { registerPansearchRoute } from "./apis/pansearch";
import { register_reader_route } from "./apis/reader";
import { register_searcher_route } from "./apis/searcher";
import { register_summary_route } from "./apis/summary";

type Bindings = {
  API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// set global middlewares
// Bearer Auth Middleware
// app.use("/api/*", async (c, next) => {
//   const auth = bearerAuth({
//     token: c.env.API_TOKEN,
//   });
//   return auth(c, next);
// });

// The OpenAPI documentation will be available at /doc
app.doc("/docs", {
  openapi: "3.0.0",
  servers: [
    {
      url: "https://tools.vaayne.com",
    },
    {
      url: "http://localhost:8787",
    },
  ],
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

// Register the security scheme: Bearer
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "Bearer",
});

// The Swagger UI will be available at /ui
app.get(
  "/ui",
  swaggerUI({
    url: "/docs",
  })
);

// register routes
register_reader_route(app);
register_searcher_route(app);
register_summary_route(app);
registerPansearchRoute(app);

app.get("/", async (c) => {
  return c.redirect("/ui")
})

export default app;
