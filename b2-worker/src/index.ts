import { getB2Token } from "./b2";
import { createRuleSet, getRuleSetID, updateRuleSet } from "./cf";
import { Env } from "./env";

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(run(env));
  },
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(run(env));
    return new Response("Done", { status: 200 });
  },
};

async function run(env: Env) {
  const ruleSetID = await getRuleSetID(env);
  console.log("ruleSetID: " + ruleSetID);
  const token = await getB2Token(env.B2_USER, env.B2_PASS);
  console.log("B2 token: " + token);
  if (ruleSetID == "") {
    await createRuleSet(env, token);
  } else {
    await updateRuleSet(env, ruleSetID, token);
  }
}
