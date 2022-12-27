const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export async function request(
  method: string,
  url: string,
  headers: HeadersInit | null,
  params: URLSearchParams | null,
  payload: BodyInit | null
) {
  if (params != null) {
    url = url + params.toString();
  }

  if (headers == null) {
    headers = new Headers(DEFAULT_HEADERS);
  }

  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: payload,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, text: ${text}`);
  }
  return await response.json();
}
