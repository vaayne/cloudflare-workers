type B2TokenResponse = {
  authorizationToken: string;
};

export async function getB2Token(
  username: string,
  password: string
): Promise<string> {
  const response = await fetch(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    {
      method: "GET",
      headers: {
        Authorization: "Basic " + btoa(username + ":" + password),
      },
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, text: ${text}`);
  }
  let data = (await response.json()) as B2TokenResponse;
  return data.authorizationToken;
}
