import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import {
    createErrorResponse,
    createSuccessResponse,
} from "../libs/common_response";
import { SummaryRequestSchema, webSummary } from "../libs/web_summary";

const route = createRoute({
    method: "get",
    path: "/api/web_summary",
    description: "Use LLM to read and summarize a web page.",
    security: [
        {
            Bearer: [],
        },
    ],
    request: {
        query: SummaryRequestSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.object({
                        success: z.boolean().openapi({ example: true }),
                        data: z
                            .string()
                            .optional()
                            .openapi({ example: "Summary text" }),
                        errors: z
                            .array(
                                z.object({
                                    code: z.number().openapi({ example: 500 }),
                                    message: z
                                        .string()
                                        .openapi({ example: "error messages" }),
                                })
                            )
                            .openapi("ErrorResponse"),
                    }),
                },
            },
            description: "Returns a summary of a web page",
        },
    },
});

export function register_summary_route(app: OpenAPIHono<any>) {
    app.openapi(route, async (c) => {
        const kv = c.env.KV;
        try {
            const args = SummaryRequestSchema.parse(c.req.query());
            const cacheKey = `$eb_summary:${JSON.stringify(args)}`;
            const cacheResult = await kv.get(cacheKey);
            if (cacheResult) {
                console.debug("Cache hit for args:", cacheKey);
                return c.json(
                    createSuccessResponse({ data: JSON.parse(cacheResult) })
                );
            }
            const isStream =
                args.stream === "true" ||
                c.req.header("accept") === "text/event-stream";
            console.log("web_summary args:", args);
            if (isStream) {
                return streamSSE(c, async (stream) => {
                    const data = await webSummary(args, stream);
                    await kv.put(cacheKey, JSON.stringify(data), {
                        expirationTtl: 24 * 3600, // 24 hours
                    });
                });
            }
            const data = await webSummary(args);
            await kv.put(cacheKey, JSON.stringify(data), {
                expirationTtl: 24 * 3600, // 24 hours
            });
            return c.json(createSuccessResponse({ data }));
        } catch (error) {
            console.error("Error processing request:", error);
            return c.json(
                createErrorResponse(500, "Internal Server Error"),
                500
            );
        }
    });
}
