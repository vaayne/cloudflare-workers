import { z } from "@hono/zod-openapi";

export const ReaderRequestSchema = z.object({
    url: z
        .string()
        .url()
        .openapi({
            param: {
                name: "url",
                in: "query",
            },
            example: "https://example.com",
            description: "URL to retrieve content from.",
        }),
});

export const SearcherRequestSchema = z.object({
    query: z.string().min(1).openapi({
        example: "how to ...",
        description: "query to search for.",
    }),
});

export const JinaReaderDataSchema = z.object({
    content: z.string().openapi({
        example: "This is the content of the page",
    }),
    title: z.string().openapi({
        example: "Example Page Title",
    }),
    url: z.string().openapi({
        example: "https://example.com",
    }),
    description: z.string().openapi({
        example: "This is the description of the page",
    }),
});
export type JinaReaderData = z.infer<typeof JinaReaderDataSchema>;

type JinaReaderResponse = {
    code: number;
    status: number;
    data: JinaReaderData;
};

type JinaSeaecherResponse = {
    code: number;
    status: number;
    data: JinaReaderData[];
};

export async function webReader(
    args: z.infer<typeof ReaderRequestSchema>
): Promise<JinaReaderData> {
    console.log(`webReader url: ${args.url}`);
    const response = await fetch(`https://r.jina.ai/${args.url}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });
    const resp: JinaReaderResponse = await response.json();
    return resp.data;
}

export async function webSearcher(
    args: z.infer<typeof SearcherRequestSchema>
): Promise<JinaReaderData[]> {
    console.log(`webSearcher query: ${args.query}`);
    const response = await fetch(`https://s.jina.ai/${args.query}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });
    const data: JinaSeaecherResponse = await response.json();
    return data.data;
}
