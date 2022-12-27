import { Env } from "./bindings";
import { request } from "./utils";

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

function buildRuleSetBody(env: Env, token: string) {
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

async function getRuleSetID(env: Env): Promise<string> {
  const url = CF_API_HOST + "/zones/" + env.CF_ZONE_ID + "/rulesets";
  const headers = buildCFHeaders(env.CF_EMAIL, env.CF_API_KEY);

  let data = (await request(
    "GET",
    url,
    headers,
    null,
    null
  )) as ListRulesetsResponse;

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

async function createRuleSet(env: Env, token: string) {
  const url = CF_API_HOST + "/zones/" + env.CF_ZONE_ID + "/rulesets";
  const headers = buildCFHeaders(env.CF_EMAIL, env.CF_API_KEY);
  const body = JSON.stringify(buildRuleSetBody(env, token));
  const data = await request("POST", url, headers, null, body);
  console.log("Create rule set: " + JSON.stringify(data));
}

async function updateRuleSet(env: Env, rulesetID: string, token: string) {
  const body = JSON.stringify({
    rules: buildRuleSetBody(env, token).rules,
  });
  const url =
    CF_API_HOST + "/zones/" + env.CF_ZONE_ID + "/rulesets/" + rulesetID;
  const headers = buildCFHeaders(env.CF_EMAIL, env.CF_API_KEY);

  const data = await request("PUT", url, headers, null, body);

  console.log("Update rule set: " + JSON.stringify(data));
}

export { getRuleSetID, createRuleSet, updateRuleSet };
