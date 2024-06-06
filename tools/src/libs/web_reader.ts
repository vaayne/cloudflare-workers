export async function webReader(url: string): Promise<any> {
  console.log(`webReader url: ${url}`);
  const response = await fetch(`https://r.jina.ai/${url}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return await response.json();
}
