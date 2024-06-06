import { Context } from "hono";
import { webReader } from "../libs/web_reader";

export async function handle_reader(c: Context) {
  const url = c.req.param("url");
  console.log(`summary url: ${url}`);
  if (!url) {
    return c.text("Please provide a URL");
  }
  const resp = await webReader(url);

  return c.json(resp);
}
