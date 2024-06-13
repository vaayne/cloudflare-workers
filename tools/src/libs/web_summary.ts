import { webReader } from "./jina_reader";

export async function webSummary(
    url: string,
    page_content: string | null
): Promise<Response> {
    console.log(`summary url: ${url}`);
    if (page_content == null) {
        const doc = await webReader(url);
        page_content = doc.content;
    }

    return await fetch("https://www.elmo.chat/api/v1/prompt", {
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
}
