import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import { streamSSE } from "hono/streaming";
import { invokeWithCache } from "../libs/cache";
import {
    createErrorResponse,
    createSuccessResponse,
} from "../libs/common_response";
import { webReader, webSearcher } from "../libs/jina_reader";
import { panSearcher } from "../libs/pansearch";
import { webSummary } from "../libs/web_summary";

const ToolEnum = z
    .enum(["web_reader", "pan_searcher", "web_searcher", "web_summary"])
    .openapi({
        description: "The name of the tool to invoke",
    });

const RequestSchema = z.object({
    name: ToolEnum,
    args: z.object({}).openapi({
        example: { key: "value" },
        description: "Args for the tools",
    }),
});

const ResponseSchema = z.object({
    success: z.boolean().openapi({
        example: true,
        description: "Whether the request is successful",
    }),
    data: z.object({}).openapi({
        example: { key: "value" },
        description: "The response data",
    }),
    errors: z
        .array(
            z.object({
                code: z.number(),
                message: z.string(),
            })
        )
        .openapi({
            example: [{ code: 400, message: "Bad Request" }],
            description: "The error messages",
        }),
});

const route = createRoute({
    method: "post",
    description: "Invoke tools",
    path: "/api/invoke",
    request: {
        body: {
            required: true,
            description: "The request body",
            content: {
                "application/json": {
                    schema: RequestSchema,
                    example: {
                        name: "web_reader",
                        args: { key: "value" },
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: "The Response from the tool",
            content: {
                "application/json": {
                    schema: ResponseSchema,
                },
                "text/event-stream": {
                    schema: ResponseSchema,
                },
            },
        },
    },
});

async function dispatch(kv: KVNamespace, name: string, args: any) {
    const cacheKey = `${name}:${JSON.stringify(args)}`;
    switch (name) {
        case "web_reader":
            return await invokeWithCache(kv, cacheKey, webReader, [args]);
        case "pan_searcher":
            return await invokeWithCache(kv, cacheKey, panSearcher, [args]);
        case "web_searcher":
            return await invokeWithCache(kv, cacheKey, webSearcher, [args]);
        case "web_summary":
            return await invokeWithCache(kv, cacheKey, webSummary, [args]);
        default:
            throw new Error(`Tool ${name} not found`);
    }
}

async function streamDispatch(
    kv: KVNamespace,
    name: string,
    args: any,
    stream?: any
) {
    if (name === "web_summary") {
        return await webSummary(args, stream);
    }

    const resp = await dispatch(kv, name, args);
    await stream.writeSSE({ data: JSON.stringify(resp) });
}

export function registerInvokeRoute(app: OpenAPIHono<any>) {
    app.openapi(route, async (c) => {
        const isStream = c.req.header("accept") === "text/event-stream";
        const { name, args } = await c.req.json();
        try {
            if (isStream) {
                return streamSSE(c, async (stream) => {
                    await streamDispatch(c.env.KV, name, args, stream);
                });
            }
            const resp = await dispatch(c.env.KV, name, args);
            console.log("Invoke success:", resp);
            return c.json(createSuccessResponse(resp), 200);
        } catch (error: any) {
            console.log("Invoke failed:", error);
            return c.json(createErrorResponse(500, error), 500);
        }
    });
}
