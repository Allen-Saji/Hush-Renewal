/*
  Retries the force-bad-settlement probe on fresh throwaway rounds until one
  clears as a DEAL (the LLM agents occasionally produce no overlap), then
  merges the result into src/fixtures/round.json.
*/

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BACKEND = process.env.BACKEND_URL ?? "https://hushrenewal-backend.onrender.com";
const AGENTS = {
  customer:
    process.env.CUSTOMER_AGENT_URL ?? "https://hushrenewal-customer-agent.onrender.com",
  vendor:
    process.env.VENDOR_AGENT_URL ?? "https://hushrenewal-vendor-agent.onrender.com",
};

async function req(pathname, init) {
  const resp = await fetch(`${BACKEND}${pathname}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`${pathname} -> ${resp.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function negotiate(role, roundId) {
  const resp = await fetch(`${AGENTS[role]}/negotiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ round_id: roundId, scenario: "deal" }),
  });
  if (!resp.ok || !resp.body) throw new Error(`negotiate ${role} -> ${resp.status}`);
  // Drain the stream; we only need the round to reach the sealed state.
  const reader = resp.body.getReader();
  while (!(await reader.read()).done) {
    /* drain */
  }
}

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "fixtures",
  "round.json",
);

for (let attempt = 1; attempt <= 4; attempt++) {
  console.log(`[force] attempt ${attempt}: opening throwaway round`);
  const round = await req("/v1/matcher/rounds", {
    method: "POST",
    body: JSON.stringify({ subscription: "Workday Enterprise HR Suite" }),
  });
  await Promise.all([
    negotiate("customer", round.round_id),
    negotiate("vendor", round.round_id),
  ]);
  const clearing = await req(`/v1/matcher/rounds/${round.round_id}/clear`, {
    method: "POST",
  });
  console.log(`[force] cleared ${clearing.outcome} price=${clearing.price}`);
  if (clearing.outcome !== "DEAL") continue;

  const force = await req(
    `/v1/adversarial/rounds/${round.round_id}/force-bad-settlement`,
    { method: "POST" },
  );
  console.log(`[force] reverted=${force.reverted} ledger_error=${force.ledger_error}`);

  const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
  fixture.force = force;
  writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
  console.log("[force] merged into round.json");
  process.exit(0);
}
throw new Error("4 throwaway rounds cleared NO_DEAL; investigate agent briefs.");
