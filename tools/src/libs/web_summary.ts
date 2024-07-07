import { z } from "@hono/zod-openapi";
import { webReader } from "./jina_reader";

export const SummaryRequestSchema = z.object({
    url: z
        .string()
        .url()
        .openapi({
            param: {
                name: "url",
                in: "query",
            },
            example: "https://example.com",
            description: "The URL of the page to summarize",
        }),
    stream: z.string().optional().openapi({
        example: false,
        description: "Whether to stream the response",
    }),
    page_content: z.string().optional().openapi({
        example: "This is the content of the page",
        description: "The content of the page to summarize",
    }),
});

async function processStream(reader: any, stream?: any) {
    let text = "";
    const decoder = new TextDecoder("utf-8");
    const regex = /0:"([^"]*)"/g;
    let result;

    while (!(result && result.done)) {
        result = await reader.read();
        const chunk = decoder.decode(result.value || new Uint8Array(), {
            stream: !result.done,
        });
        let match;
        while ((match = regex.exec(chunk)) !== null) {
            const formattedText = match[1].replace(/\\n/g, "\n");
            console.log(formattedText);
            if (stream) {
                await stream.writeSSE({ data: formattedText });
            }
            text += formattedText;
        }
    }
    return text;
}

export async function webSummary(
    args: z.infer<typeof SummaryRequestSchema>,
    stream?: any
): Promise<any> {
    console.log(`summary url: ${args.url}`);
    const url = args.url;
    let page_content = args.page_content;

    if (page_content == null) {
        const doc = await webReader({ url: url });
        page_content = doc.content;
    }

    const resp = await fetch("https://www.elmo.chat/api/v1/prompt", {
        method: "POST",
        body: JSON.stringify({
            metadata: {
                system: { language: "zh-Hans" },
                website: { url: url, content: page_content },
            },
            regenerate: false,
            conversation: [{ role: "user", content: "/summarize" }],
            enableCache: true,
        }),
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Content-Type": "text/plain;charset=UTF-8",
            Accept: "*/*",
        },
    });

    const reader = resp.body?.getReader();

    if (!reader) {
        throw Error("Error reading the response");
    }

    if (stream) {
        return await processStream(reader, stream);
    }
    return processStream(reader);
}
