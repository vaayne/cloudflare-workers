import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { invokeWithCache } from "../libs/cache";
import {
    buildCommonResponseSchema,
    createErrorResponse,
    createSuccessResponse,
} from "../libs/common_response";
import {
    JinaReaderDataSchema,
    ReaderRequestSchema,
    webReader,
} from "../libs/jina_reader";

const route = createRoute({
    method: "get",
    path: "/api/web_reader",
    description: "Retrieve LLM-friendly content from a URL.",
    security: [
        {
            Bearer: [],
        },
    ],
    request: {
        query: ReaderRequestSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: buildCommonResponseSchema(JinaReaderDataSchema),
                },
            },
            description: "Returns the content of a web page",
        },
    },
});

export function register_reader_route(app: OpenAPIHono<any>) {
    app.openapi(route, async (c) => {
        const { url } = c.req.valid("query");
        if (!url) {
            return c.text("Please provide a URL");
        }
        try {
            const resp = await invokeWithCache(c.env.KV, url, webReader, [
                { url: url },
            ]);
            return c.json(createSuccessResponse(resp), 200);
        } catch (error) {
            return c.json(
                createErrorResponse(
                    500,
                    `Failed to read the web page: ${error}`
                ),
                500
            );
        }
    });
}
