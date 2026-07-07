"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Eye, WarningOctagon } from "@phosphor-icons/react";
import { api, formatMoney, type ContractView, type Role } from "@/lib/api";
import { Cid } from "./ui";

const roles: { id: Role; label: string }[] = [
  { id: "customer", label: "Customer" },
  { id: "vendor", label: "Vendor" },
  { id: "matcher", label: "Matcher" },
];

// The reservation field each side must NOT be able to see in its own projection.
const forbiddenField: Record<Role, string | null> = {
  customer: "minPrice",
  vendor: "maxPrice",
  matcher: null,
};

const note: Record<Role, string> = {
  customer: "Your projection never contains the vendor's floor (minPrice).",
  vendor: "Your projection never contains the customer's ceiling (maxPrice).",
  matcher:
    "As the neutral clearer you see both sealed numbers. This is the honest trust boundary.",
};

const MONEY_KEYS = new Set(["price", "amount", "maxPrice", "minPrice"]);
const SHOW_KEYS = ["subscription", "outcome", "maxPrice", "minPrice", "price", "amount"];

function fields(payload: Record<string, unknown>) {
  return SHOW_KEYS.filter((k) => payload[k] !== undefined && payload[k] !== null).map(
    (k) => {
      const raw = payload[k];
      const value = MONEY_KEYS.has(k) ? formatMoney(raw as string) : String(raw);
      return { key: k, value };
    },
  );
}

export function LedgerProjection({
  roundId,
  refreshKey,
}: {
  roundId: string | null;
  refreshKey: number;
}) {
  const [role, setRole] = useState<Role>("customer");
  const [rows, setRows] = useState<ContractView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    api
      .contracts(role)
      .then((all) => {
        if (ignore) return;
        const scoped = roundId
          ? all.filter((c) => c.payload.roundId === roundId)
          : [];
        setRows(scoped);
      })
      .catch((e: unknown) => {
        if (!ignore) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [role, roundId, refreshKey]);

  const forbidden = forbiddenField[role];
  const leak = forbidden
    ? rows.some((r) => JSON.stringify(r.payload).includes(forbidden))
    : false;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Eye size={16} weight="bold" className="text-accent" />
          What each party can see on the ledger
        </div>
        <div className="flex gap-1.5">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`rounded-btn border px-3 py-1.5 text-xs font-medium transition-colors ${
                role === r.id
                  ? "border-accent/50 bg-accent-soft text-ink"
                  : "border-line text-muted hover:border-faint hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy banner */}
      <div className="border-b border-line bg-surface-2 px-5 py-3">
        {forbidden ? (
          <div className="flex items-center gap-2 text-sm">
            {leak ? (
              <WarningOctagon
                size={16}
                weight="fill"
                className="text-[color:var(--color-nodeal)]"
              />
            ) : (
              <CheckCircle
                size={16}
                weight="fill"
                className="text-[color:var(--color-deal)]"
              />
            )}
            <span className="text-muted">
              {leak ? (
                <>Leak: <code className="font-mono">{forbidden}</code> is visible here.</>
              ) : (
                <>
                  <code className="font-mono text-ink">{forbidden}</code> is absent from
                  this view. {note[role]}
                </>
              )}
            </span>
          </div>
        ) : (
          <div className="text-sm text-muted">{note[role]}</div>
        )}
      </div>

      {/* Contract list */}
      <div className="min-h-[7rem] p-3">
        {loading && rows.length === 0 ? (
          <div className="px-2 py-6 text-sm text-faint">Reading the ledger...</div>
        ) : error ? (
          <div className="px-2 py-6 text-sm text-[color:var(--color-nodeal)]">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-2 py-6 text-sm text-faint">
            {roundId
              ? "No contracts visible to this party for the current round yet."
              : "Open a round to populate the ledger."}
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {rows.map((c) => (
              <li
                key={c.contract_id}
                className="rounded-btn border border-line bg-bg/40 px-3.5 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{c.template}</span>
                  <Cid value={c.contract_id} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {fields(c.payload).map((f) => (
                    <span key={f.key} className="text-xs">
                      <span className="text-faint">{f.key}: </span>
                      <span className="font-mono text-muted">{f.value}</span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
