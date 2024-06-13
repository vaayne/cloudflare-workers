import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../libs/common_response";
import { search } from "../libs/pansearch";

const PansearchRequestSchema = z.object({
  query: z
    .string()
    .min(1)
    .openapi({ example: "sample query", description: "Search query" })
    .openapi({
      param: {
        name: "query",
        in: "query",
        description: "The search term used to find relevant content.",
      },
    }),
});

const SearchDataSchema = z.object({
  id: z.number().openapi({ example: 188382 }),
  content: z
    .string()
    .openapi({
      example:
        '名称：黑暗物质  His <span class=\'highlight-keyword\'>Dark</span> Materials (2019) \n1-3季全 4K 2160P\n\n描述：故事发生在不同于现实的异世界中。在这个世界中，所有的人类均拥有被称为守护精灵的动物同伴，这些动物是人类灵魂的具象体现。女主角莱拉·贝拉奎亚成长于英国牛津的约旦学院。在她前往伦敦寻找失踪的朋友罗杰的过程中，莱拉发现一系列儿童失踪事件与神秘物质尘埃有所关联。随着故事展开，她还发现了涉及到阿斯瑞尔勋爵和玛莉莎·库尔特的危险秘密。\n\n链接：<a class="resource-link" target="_blank" href="https://www.aliyundrive.com/s/8HCpGkERD77">https://www.aliyundrive.com/s/8HCpGkERD77</a>\n\n📁 大小：N\n🏷 标签：#黑暗物质 #英剧 #BBC\n🎉 来自：雷锋\n📢 频道：@Aliyundrive_Share_Channel\n👥 群组：@alyd_g\n🤖 投稿：@AliYunPanBot',
      description: "Detailed description of the content, including metadata and links.",
    }),
  pan: z.string().openapi({ example: "aliyundrive" }),
  image: z
    .string()
    .openapi({
      example:
        "https://cdn.pansearch.me/resources/f64ed3eb3970cf50d883033532094de3.jpg",
    }),
  time: z.string().openapi({ example: "2023-06-12T15:13:06+08:00" }),
});

const PansearchResponseSchema = z
  .array(SearchDataSchema)
  .openapi({
    example: [
      {
        id: 1,
        content: "sample content",
        pan: "aliyundrive",
        image: "https://example.com/image.jpg",
        time: "2023-10-01T12:00:00Z",
      },
    ],
  })
  .openapi("PansearchResponse");

/**
 * Registers the pansearch route with the provided app.
 * @param {OpenAPIHono<any>} app - The Hono app instance
 */
const route = createRoute({
  method: "get",
  description: "Search for files and resources within AliYunPan (web drive) using keyword.",
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
      return c.json(createSuccessResponse(results), 200);
    } catch (error) {
      console.error("Search failed:", error);
      return c.json(createErrorResponse(500, "Search failed"), 500);
    }
  });
}
