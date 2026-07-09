/*
  Client for the two autonomous negotiation agents (../agents service). Each
  agent runs as its own process on its own origin; the customer agent and the
  vendor agent are reached at separate URLs so the isolation is visible even
  from the browser. `context` shows what an agent can see (its own brief);
  `negotiate` streams the agent's reasoning as it thinks, then the number it
  sealed on Canton.
*/

export type AgentRole = "customer" | "vendor";
export type Scenario = "deal" | "no_deal";

const AGENT_URLS: Record<AgentRole, string> = {
  customer: (
    process.env.NEXT_PUBLIC_CUSTOMER_AGENT_URL ?? "http://127.0.0.1:8100"
  ).replace(/\/$/, ""),
  vendor: (
    process.env.NEXT_PUBLIC_VENDOR_AGENT_URL ?? "http://127.0.0.1:8200"
  ).replace(/\/$/, ""),
};

export function agentBase(role: AgentRole): string {
  return AGENT_URLS[role];
}

export type AgentContext = {
  role: AgentRole;
  scenario: Scenario;
  brief: Record<string, unknown>;
  can_see_counterparty_brief: boolean;
  can_see_counterparty_number: boolean;
};

/** One event from the /negotiate stream. `name` is the SSE event type. */
export type AgentEvent =
  | { name: "start"; data: { role: AgentRole; round_id: string; scenario: Scenario } }
  | { name: "reasoning"; data: { text: string } }
  | {
      name: "decision";
      data: { reservation_price: string; confidence: number; rationale: string };
    }
  | { name: "sealed"; data: { contract_id: string; side: "bid" | "ask" } }
  | { name: "done"; data: { reservation_price: string; contract_id: string } }
  | { name: "error"; data: { message: string } };

export async function fetchAgentContext(
  role: AgentRole,
  scenario: Scenario,
): Promise<AgentContext> {
  const resp = await fetch(`${agentBase(role)}/context?scenario=${scenario}`);
  if (!resp.ok) throw new Error(`Agent ${role} context failed (${resp.status})`);
  return (await resp.json()) as AgentContext;
}

function parseEvent(chunk: string): AgentEvent | null {
  let name = "message";
  const dataLines: string[] = [];
  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  try {
    return { name, data: JSON.parse(dataLines.join("\n")) } as AgentEvent;
  } catch {
    return null;
  }
}

/**
 * Stream a negotiation. Yields events as the agent produces them: `start`,
 * many `reasoning`, `decision`, `sealed`, `done` -- or `error`. Uses a fetched
 * ReadableStream (EventSource can't POST), parsing the SSE framing by hand.
 */
export async function* negotiate(
  role: AgentRole,
  roundId: string,
  scenario: Scenario,
  signal?: AbortSignal,
): AsyncGenerator<AgentEvent> {
  const resp = await fetch(`${agentBase(role)}/negotiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ round_id: roundId, scenario }),
    signal,
  });
  if (!resp.ok || !resp.body) {
    throw new Error(`Agent ${role} negotiate failed (${resp.status})`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const evt = parseEvent(raw);
      if (evt) yield evt;
    }
  }
}
