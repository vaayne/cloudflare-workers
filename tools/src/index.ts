import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle_reader } from "./apis/reader";
import { handle_summary } from "./apis/summary";
import { Bindings } from "./envs";

function registe_middlewares(app: Hono<{ Bindings: Bindings }>) {
  // Bearer Auth Middleware
  app.use("/api/*", async (c, next) => {
    const auth = bearerAuth({
      token: c.env.API_TOKEN,
    });
    return auth(c, next);
  });
}

function registe_routes(app: Hono<{ Bindings: Bindings }>) {
  app.get("/api/summary/:url", handle_summary);
  app.get("/api/reader/:url", handle_reader);

  app.get("/", (c) => {
    return c.text("Hello Hono!");
  });
}

const app = new Hono<{ Bindings: Bindings }>();
registe_middlewares(app);
registe_routes(app);
export default app;
