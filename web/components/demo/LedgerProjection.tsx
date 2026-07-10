"use client";

import { useEffect, useState } from "react";
import { api, type ContractView, type Role } from "@/lib/api";
import { ProjectionView, type ProjectionViewMode } from "./LedgerProjection.view";

export function LedgerProjection({
  roundId,
  refreshKey,
}: {
  roundId: string | null;
  refreshKey: number;
}) {
  const [role, setRole] = useState<Role>("customer");
  const [view, setView] = useState<ProjectionViewMode>("cards");
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

  return (
    <ProjectionView
      role={role}
      view={view}
      rows={rows}
      loading={loading}
      error={error}
      roundId={roundId}
      onRole={setRole}
      onView={setView}
    />
  );
}
