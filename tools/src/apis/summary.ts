import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import {
    createErrorResponse,
    createSuccessResponse,
} from "../libs/common_response";
import { webSummary } from "../libs/web_summary";

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
            description: "The URL of the page to summarize",
        }),
});

const route = createRoute({
    method: "get",
    path: "/api/summary",
    description: "Use LLM to read and summarize a web page.",
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
        const { url } = c.req.valid("query");
        const resp = await webSummary(url, null);
        const reader = resp.body?.getReader();

        if (!reader) {
            return c.json(
                createErrorResponse(500, "Error reading the response"),
                500
            );
        }

        const processStream = async (stream: any) => {
            let result;
            const decoder = new TextDecoder("utf-8");
            const regex = /0:"([^"]*)"/g;

            while (!(result && result.done)) {
                result = await reader.read();
                const chunk = decoder.decode(result.value || new Uint8Array(), {
                    stream: !result.done,
                });
                let match;
                while ((match = regex.exec(chunk)) !== null) {
                    if (stream) {
                        await stream.writeSSE({
                            data: match[1].replace(/\\n/g, "\n"),
                        });
                    } else {
                        text += match[1].replace(/\\n/g, "\n");
                    }
                }
            }
        };

        if (c.req.header("accept") === "text/event-stream") {
            return streamSSE(c, async (stream) => await processStream(stream));
        }

        let text = "";
        let result;
        const decoder = new TextDecoder("utf-8");
        const regex = /0:"([^"]*)"/g;

        while (!(result && result.done)) {
            result = await reader.read();
            const chunk = decoder.decode(result.value || new Uint8Array(), {
                stream: !result.done,
            });
            let match;
            while ((match = regex.exec(chunk)) !== null) {
                text += match[1].replace(/\\n/g, "\n");
            }
        }

        return c.json(createSuccessResponse(text), 200);
    });
}
