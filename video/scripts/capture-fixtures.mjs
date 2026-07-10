/*
  Captures one real HushRenewal round from production into
  src/fixtures/round.json. The demo video replays this data through the
  production view components, so every number, cid, and reasoning line in
  the video comes from a live Canton DevNet round.

  Run: node scripts/capture-fixtures.mjs
*/

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BACKEND = process.env.BACKEND_URL ?? "https://hushrenewal-backend.onrender.com";
const AGENTS = {
  customer:
    process.env.CUSTOMER_AGENT_URL ?? "https://hushrenewal-customer-agent.onrender.com",
  vendor:
    process.env.VENDOR_AGENT_URL ?? "https://hushrenewal-vendor-agent.onrender.com",
};

async function req(base, pathname, init) {
  const resp = await fetch(`${base}${pathname}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`${pathname} -> ${resp.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

function parseEvent(chunk) {
  let name = "message";
  const dataLines = [];
  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  try {
    return { name, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return null;
  }
}

// Streams /negotiate and returns { events, reasoning, decision, sealedCid }.
async function negotiate(role, roundId, scenario) {
  const resp = await fetch(`${AGENTS[role]}/negotiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ round_id: roundId, scenario }),
  });
  if (!resp.ok || !resp.body) throw new Error(`negotiate ${role} -> ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events = [];
  let reasoning = "";
  let decision = null;
  let sealedCid = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const ev = parseEvent(raw);
      if (!ev) continue;
      events.push(ev);
      if (ev.name === "reasoning") reasoning += ev.data.text;
      else if (ev.name === "decision")
        decision = {
          price: ev.data.reservation_price,
          confidence: ev.data.confidence,
          rationale: ev.data.rationale,
        };
      else if (ev.name === "sealed") sealedCid = ev.data.contract_id;
      else if (ev.name === "error") throw new Error(`agent ${role}: ${ev.data.message}`);
    }
  }
  return { events, reasoning, decision, sealedCid };
}

async function contextOf(role) {
  const resp = await fetch(`${AGENTS[role]}/context?scenario=deal`);
  if (!resp.ok) throw new Error(`context ${role} -> ${resp.status}`);
  return resp.json();
}

async function agentSettle(role, roundId) {
  const resp = await fetch(`${AGENTS[role]}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ round_id: roundId }),
  });
  if (!resp.ok) throw new Error(`settle ${role} -> ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

const step = (msg) => console.log(`[capture] ${msg}`);

// --- Main showcase round ---------------------------------------------------
step("warming services...");
await Promise.all([
  req(BACKEND, "/health"),
  fetch(`${AGENTS.customer}/health`),
  fetch(`${AGENTS.vendor}/health`),
]);

step("opening round");
const round = await req(BACKEND, "/v1/matcher/rounds", {
  method: "POST",
  body: JSON.stringify({ subscription: "Workday Enterprise HR Suite" }),
});
step(`round ${round.round_id}`);

step("fetching briefs");
const [customerCtx, vendorCtx] = await Promise.all([
  contextOf("customer"),
  contextOf("vendor"),
]);

step("negotiating (both agents in parallel)");
const [customerNeg, vendorNeg] = await Promise.all([
  negotiate("customer", round.round_id, "deal"),
  negotiate("vendor", round.round_id, "deal"),
]);
step(
  `sealed customer=${customerNeg.decision?.price} vendor=${vendorNeg.decision?.price}`,
);

step("clearing");
const clearing = await req(BACKEND, `/v1/matcher/rounds/${round.round_id}/clear`, {
  method: "POST",
});
step(`outcome ${clearing.outcome} price=${clearing.price}`);
if (clearing.outcome !== "DEAL") {
  throw new Error("Deal scenario cleared as NO_DEAL; rerun the capture.");
}

step("settling (agent-driven)");
await req(BACKEND, `/v1/matcher/rounds/${round.round_id}/settlement/propose`, {
  method: "POST",
});
const customerSettle = await agentSettle("customer", round.round_id);
const vendorSettle = await agentSettle("vendor", round.round_id);

step("capturing per-role projections");
const projections = {};
for (const role of ["customer", "vendor", "matcher"]) {
  const all = await req(BACKEND, `/v1/parties/${role}/contracts`);
  projections[role] = all.filter((c) => c.payload.roundId === round.round_id);
}

step("peek probe");
const peek = await req(BACKEND, `/v1/adversarial/rounds/${round.round_id}/peek`, {
  method: "POST",
});

// --- Throwaway round for the force-bad-settlement probe ---------------------
step("throwaway round for force-bad-settle");
const round2 = await req(BACKEND, "/v1/matcher/rounds", {
  method: "POST",
  body: JSON.stringify({ subscription: "Workday Enterprise HR Suite" }),
});
await Promise.all([
  negotiate("customer", round2.round_id, "deal"),
  negotiate("vendor", round2.round_id, "deal"),
]);
const clearing2 = await req(BACKEND, `/v1/matcher/rounds/${round2.round_id}/clear`, {
  method: "POST",
});
let force = null;
if (clearing2.outcome === "DEAL") {
  force = await req(
    BACKEND,
    `/v1/adversarial/rounds/${round2.round_id}/force-bad-settlement`,
    { method: "POST" },
  );
  step(`force-bad-settle reverted=${force.reverted}`);
} else {
  step("throwaway round was NO_DEAL; force probe skipped (rerun if needed)");
}

// The template id is "<packageId>:<Module>:<Template>".
const packageId = projections.matcher[0]?.template?.split(":")[0] ?? null;

const fixture = {
  captured_from: BACKEND,
  round,
  briefs: { customer: customerCtx.brief, vendor: vendorCtx.brief },
  reasoning: { customer: customerNeg.reasoning, vendor: vendorNeg.reasoning },
  decisions: { customer: customerNeg.decision, vendor: vendorNeg.decision },
  sealedCids: { customer: customerNeg.sealedCid, vendor: vendorNeg.sealedCid },
  clearing,
  settlement: { customer: customerSettle, vendor: vendorSettle },
  projections,
  peek,
  force,
  ids: {
    packageId,
    matcher: round.matcher,
    customer: round.customer,
    vendor: round.vendor,
  },
};

const out = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "fixtures",
  "round.json",
);
writeFileSync(out, JSON.stringify(fixture, null, 2));
step(`wrote ${out}`);

// Quick gate summary
console.log(
  JSON.stringify(
    {
      reasoning_chars: {
        customer: customerNeg.reasoning.length,
        vendor: vendorNeg.reasoning.length,
      },
      deal_price: clearing.price,
      peek_verdict: peek.verdict,
      force_reverted: force?.reverted ?? "SKIPPED",
      projections: Object.fromEntries(
        Object.entries(projections).map(([k, v]) => [k, v.length]),
      ),
      packageId,
    },
    null,
    2,
  ),
);
