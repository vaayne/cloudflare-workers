import { z } from "@hono/zod-openapi";

const BASE_URL = "https://www.pansearch.me";

export const PanSearcherRequestSchema = z.object({
    query: z
        .string()
        .min(1)
        .openapi({
            example: "loki",
            description: "query to search for.",
        })
        .openapi({
            param: {
                name: "query",
                in: "query",
                required: true,
                description: "The search term used to find relevant content.",
            },
        }),
});

export const PanSearcherDataSchema = z.object({
    id: z.number().openapi({ example: 188382 }),
    content: z.string().openapi({
        example:
            '名称：黑暗物质  His <span class=\'highlight-keyword\'>Dark</span> Materials (2019) \n1-3季全 4K 2160P\n\n描述：故事发生在不同于现实的异世界中。在这个世界中，所有的人类均拥有被称为守护精灵的动物同伴，这些动物是人类灵魂的具象体现。女主角莱拉·贝拉奎亚成长于英国牛津的约旦学院。在她前往伦敦寻找失踪的朋友罗杰的过程中，莱拉发现一系列儿童失踪事件与神秘物质尘埃有所关联。随着故事展开，她还发现了涉及到阿斯瑞尔勋爵和玛莉莎·库尔特的危险秘密。\n\n链接：<a class="resource-link" target="_blank" href="https://www.aliyundrive.com/s/8HCpGkERD77">https://www.aliyundrive.com/s/8HCpGkERD77</a>\n\n📁 大小：N\n🏷 标签：#黑暗物质 #英剧 #BBC\n🎉 来自：雷锋\n📢 频道：@Aliyundrive_Share_Channel\n👥 群组：@alyd_g\n🤖 投稿：@AliYunPanBot',
        description:
            "Detailed description of the content, including metadata and links.",
    }),
    pan: z.string().openapi({ example: "aliyundrive" }),
    image: z.string().openapi({
        example:
            "https://cdn.pansearch.me/resources/f64ed3eb3970cf50d883033532094de3.jpg",
    }),
    time: z.string().openapi({ example: "2023-06-12T15:13:06+08:00" }),
});

type SearchData = z.infer<typeof PanSearcherDataSchema>;

type ResponseData = {
    pageProps: {
        data: { data: SearchData[] };
    };
};

/**
 * Performs a search on pansearch.me with the specified query.
 * @param {string} query - The search query.
 * @returns {Promise<any>} The search results.
 */
export async function panSearcher(
    args: z.infer<typeof PanSearcherRequestSchema>
): Promise<SearchData[]> {
    try {
        const buildId = await fetchBuildId();
        if (!buildId) {
            throw new Error("Build ID not found.");
        }

        const searchUrl = `${BASE_URL}/_next/data/${buildId}/search.json`;
        const queryParams = new URLSearchParams({
            pan: "aliyundrive",
            keyword: args.query,
            offset: "0",
            limit: "10",
        });

        const response = await fetch(`${searchUrl}?${queryParams}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Search failed with status: ${response.status}`);
        }

        const responseData: ResponseData = await response.json();
        const {
            pageProps: {
                data: { data },
            },
        } = responseData;
        return data;
    } catch (error: any) {
        console.error(error.message);
        return [];
    }
}

/**
 * Fetches the build ID from the base URL's HTML content.
 * @returns {Promise<string>} The build ID if found, otherwise an empty string.
 */
async function fetchBuildId(): Promise<string> {
    try {
        const response = await fetch(BASE_URL);
        const pageContent = await response.text();
        const regex = /"buildId":"(.*?)"/;
        const match = regex.exec(pageContent);
        return match ? match[1] : "";
    } catch (error) {
        console.error("Failed to fetch build ID:", error);
        return "";
    }
}
