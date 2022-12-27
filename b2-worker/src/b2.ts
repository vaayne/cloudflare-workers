import { request } from "./utils";

type B2TokenResponse = {
  authorizationToken: string;
};

const B2TOKEN_URL = "https://api.backblazeb2.com/b2api/v2/b2_authorize_account";

export async function getB2Token(
  username: string,
  password: string
): Promise<string> {
  const resp = await request(
    "GET",
    B2TOKEN_URL,
    {
      Authorization: "Basic " + btoa(username + ":" + password),
    },
    null,
    null
  );

  let data = resp as B2TokenResponse;
  return data.authorizationToken;
}
