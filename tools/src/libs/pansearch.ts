const BASE_URL = "https://www.pansearch.me";

/**
 * Fetches the build ID from the base URL's HTML content.
 * @returns {Promise<string>} The build ID if found, otherwise an empty string.
 */
async function fetchBuildId(): Promise<string> {
  try {
    const response = await fetch(BASE_URL);
    const pageContent = await response.text();
    const regex = /"build_id":"(.*?)"/;
    const match = regex.exec(pageContent);
    return match ? match[1] : "";
  } catch (error) {
    console.error("Failed to fetch build ID:", error);
    return "";
  }
}

interface ResponseData {
  pageProps: {
    data: { data: any };
  };
}

/**
 * Performs a search on pansearch.me with the specified query.
 * @param {string} query - The search query.
 * @returns {Promise<any>} The search results.
 */
export async function search(query: string): Promise<any> {
  try {
    const buildId = await fetchBuildId();
    if (!buildId) {
      throw new Error("Build ID not found.");
    }

    const searchUrl = `${BASE_URL}/_next/data/${buildId}/search.json`;
    const queryParams = new URLSearchParams({
      pan: "aliyundrive",
      keyword: query,
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
