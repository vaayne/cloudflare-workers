import { Env } from "./env";

const CF_API_HOST = "https://api.cloudflare.com/client/v4";
const REQUEST_PHASE = "http_request_late_transform";

function buildCFHeaders(email: string, apiKey: string) {
  return {
    "X-Auth-Email": email,
    "X-Auth-Key": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

type RuleSet = {
  id: string;
  name: string;
  description: string;
  kind: string;
  version: string;
  last_updated: string;
  phase: string;
};

type ListRulesetsResponse = {
  result: Array<RuleSet>;
  success: boolean;
};

export async function getRuleSetID(env: Env): Promise<string> {
  const response = await fetch(
    CF_API_HOST + "/zones/" + env.CF_ZONE_ID + "/rulesets",
    {
      method: "GET",
      headers: buildCFHeaders(env.CF_EMAIL, env.CF_API_KEY),
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, text: ${text}`);
  }
  const data = (await response.json()) as ListRulesetsResponse;
  // console.log("List rulesets: " + JSON.stringify(data));
  let rulesetId = "";
  for (const rule of data.result) {
    if (rule.phase == REQUEST_PHASE) {
      rulesetId = rule.id;
      break;
    }
  }
  return rulesetId;
}

export function buildRuleSetBody(env: Env, token: string) {
  return {
    name: "Set auth header ruleset",
    kind: "zone",
    description: "HTTP Request header Modification rule for B2",
    rules: [
      {
        action: "rewrite",
        expression: `(http.host eq "${env.DOMAIN}")`,
        description: "BackBlaze B2 Auth header",
        enabled: true,
        action_parameters: {
          headers: {
            Authorization: {
              operation: "set",
              value: token,
            },
          },
        },
      },
    ],
    phase: REQUEST_PHASE,
  };
}

export async function createRuleSet(env: Env, token: string) {
  const response = await fetch(
    CF_API_HOST + "/zones/" + env.CF_ZONE_ID + "/rulesets",
    {
      method: "POST",
      headers: buildCFHeaders(env.CF_EMAIL, env.CF_API_KEY),
      body: JSON.stringify(buildRuleSetBody(env, token)),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, text: ${JSON.stringify(text)}`
    );
  }
  const data = await response.json();
  console.log("Create rule set: " + JSON.stringify(data));
}

export async function updateRuleSet(
  env: Env,
  rulesetID: string,
  token: string
) {
  const body = JSON.stringify({
    rules: buildRuleSetBody(env, token).rules,
  });

  const response = await fetch(
    CF_API_HOST + "/zones/" + env.CF_ZONE_ID + "/rulesets/" + rulesetID,
    {
      method: "PUT",
      headers: buildCFHeaders(env.CF_EMAIL, env.CF_API_KEY),
      body: body,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, text: ${JSON.stringify(text)}`
    );
  }
  const data = await response.json();
  console.log("Update rule set: " + JSON.stringify(data));
}
