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

export type JinaReaderData = {
  content: string;
  title: string;
  url: string;
  description: string;
};

export async function webReader(url: string): Promise<JinaReaderData> {
  console.log(`webReader url: ${url}`);
  const response = await fetch(`https://r.jina.ai/${url}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  const resp: JinaReaderResponse = await response.json();
  return resp.data;
}

export async function webSearcher(query: string): Promise<JinaReaderData[]> {
  console.log(`webSearcher query: ${query}`);
  const response = await fetch(`https://s.jina.ai/${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  const data: JinaSeaecherResponse = await response.json();
  return data.data;
}
