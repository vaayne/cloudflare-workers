import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { invokeWithCache } from "../libs/cache";
import {
    createErrorResponse,
    createSuccessResponse,
} from "../libs/common_response";
import {
    PanSearcherDataSchema,
    PanSearcherRequestSchema,
    panSearcher,
} from "../libs/pansearch";

/**
 * Registers the pansearch route with the provided app.
 * @param {OpenAPIHono<any>} app - The Hono app instance
 */
const route = createRoute({
    method: "get",
    description:
        "Search for files and resources within AliYunPan (web drive) using keyword.",
    path: "/api/pan_searcher",
    request: {
        query: PanSearcherRequestSchema,
    },
    responses: {
        200: {
            description: "The search results",
            content: {
                "application/json": {
                    schema: z
                        .array(PanSearcherDataSchema)
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
                        .openapi("PansearchResponse"),
                },
            },
        },
    },
});

export function registerPansearchRoute(app: OpenAPIHono<any>) {
    app.openapi(route, async (c) => {
        const query = c.req.query("query");
        if (!query) {
            return c.json(
                createErrorResponse(
                    400,
                    "BadRequest. Please provide a search query."
                ),
                400
            );
        }
        try {
            const results = await invokeWithCache(
                c.env.KV,
                query,
                panSearcher,
                [{ query: query }]
            );
            return c.json(createSuccessResponse(results), 200);
        } catch (error) {
            console.error("Search failed:", error);
            return c.json(createErrorResponse(500, "Search failed"), 500);
        }
    });
}
