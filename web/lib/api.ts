/*
  Typed client for the HushRenewal matcher service (FastAPI). The base URL is
  build-time public config; in dev it falls back to the local backend.
  Every response shape mirrors backend/src/hushrenewal/domain/schemas.py.
*/

const BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

export const API_BASE = BASE;

export type Round = {
  round_id: string;
  contract_id: string;
  matcher: string;
  customer: string;
  vendor: string;
  subscription: string;
  deadline: string;
};

export type Submit = { contract_id: string };

export type Clearing = {
  contract_id: string;
  outcome: "DEAL" | "NO_DEAL";
  price: string | null;
};

export type SettlementProposal = { contract_id: string };

export type CustomerAccept = {
  accepted_contract_id: string;
  cash_contract_id: string;
};

export type Settlement = {
  license_contract_id: string;
  vendor_cash_contract_id: string;
};

export type ContractView = {
  template: string;
  contract_id: string;
  payload: Record<string, unknown>;
};

export type PeekResult = {
  round_id: string;
  bid_exists: boolean;
  bid_contract_id: string | null;
  vendor_can_see_bid: boolean;
  vendor_visible_templates: string[];
  verdict: "denied" | "leaked";
};

export type ForceBadSettlementResult = {
  round_id: string;
  deal_price: string;
  escrowed_amount: string;
  reverted: boolean;
  ledger_error: string | null;
  note: string;
};

export type Health = { status: string; ledger_end: number | null };

export type Role = "customer" | "vendor" | "matcher";

export class ApiError extends Error {
  status: number;
  code?: string | null;
  constructor(message: string, status: number, code?: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(
      `Can't reach the matcher service at ${BASE}. Is the backend running?`,
      0,
    );
  }

  const text = await resp.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!resp.ok) {
    throw new ApiError(errorMessage(body, resp.status), resp.status, codeOf(body));
  }
  return body as T;
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.message === "string") return b.message;
    if (typeof b.detail === "string") return b.detail;
    if (Array.isArray(b.detail)) {
      return b.detail
        .map((d) => (d as { msg?: string }).msg ?? String(d))
        .join("; ");
    }
  }
  return `Request failed (${status})`;
}

function codeOf(body: unknown): string | null {
  if (body && typeof body === "object") {
    const c = (body as Record<string, unknown>).code;
    if (typeof c === "string") return c;
  }
  return null;
}

export const api = {
  health: () => req<Health>("/health/ledger"),

  openRound: (subscription: string) =>
    req<Round>("/v1/matcher/rounds", {
      method: "POST",
      body: JSON.stringify({ subscription }),
    }),

  submitBid: (roundId: string, maxPrice: string) =>
    req<Submit>(`/v1/customer/rounds/${roundId}/bid`, {
      method: "POST",
      body: JSON.stringify({ max_price: maxPrice }),
    }),

  submitAsk: (roundId: string, minPrice: string) =>
    req<Submit>(`/v1/vendor/rounds/${roundId}/ask`, {
      method: "POST",
      body: JSON.stringify({ min_price: minPrice }),
    }),

  clear: (roundId: string) =>
    req<Clearing>(`/v1/matcher/rounds/${roundId}/clear`, { method: "POST" }),

  propose: (roundId: string) =>
    req<SettlementProposal>(
      `/v1/matcher/rounds/${roundId}/settlement/propose`,
      { method: "POST" },
    ),

  customerAccept: (roundId: string) =>
    req<CustomerAccept>(`/v1/customer/rounds/${roundId}/settlement/accept`, {
      method: "POST",
    }),

  vendorAccept: (roundId: string) =>
    req<Settlement>(`/v1/vendor/rounds/${roundId}/settlement/accept`, {
      method: "POST",
    }),

  contracts: (role: Role) => req<ContractView[]>(`/v1/parties/${role}/contracts`),

  peek: (roundId: string) =>
    req<PeekResult>(`/v1/adversarial/rounds/${roundId}/peek`, { method: "POST" }),

  forceBadSettlement: (roundId: string) =>
    req<ForceBadSettlementResult>(
      `/v1/adversarial/rounds/${roundId}/force-bad-settlement`,
      { method: "POST" },
    ),
};

/** Group a decimal string as currency, e.g. "90466.72" -> "$90,466.72". */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "--";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

/** Short contract-id for display: first 10 chars + ellipsis. */
export function shortCid(cid: string): string {
  return cid.length > 14 ? `${cid.slice(0, 10)}...` : cid;
}
