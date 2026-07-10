"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  fetchAgentContext,
  negotiate,
  type AgentContext,
  type AgentRole,
  type Scenario,
} from "@/lib/agents";
import {
  AgentPanelView,
  META,
  type Decision,
  type Phase,
} from "./AgentPanel.view";

export type AgentHandle = { run: () => Promise<void> };

export const AgentNegotiation = forwardRef<
  AgentHandle,
  {
    role: AgentRole;
    scenario: Scenario;
    roundId: string | null;
    onSealed: (contractId: string) => void;
  }
>(function AgentNegotiation({ role, scenario, roundId, onSealed }, ref) {
  const meta = META[role];
  const [context, setContext] = useState<AgentContext | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reasoning, setReasoning] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [sealedCid, setSealedCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<HTMLDivElement | null>(null);

  // Load what this agent can see whenever the scenario changes.
  useEffect(() => {
    let ignore = false;
    fetchAgentContext(role, scenario)
      .then((c) => !ignore && setContext(c))
      .catch(() => !ignore && setContext(null));
    return () => {
      ignore = true;
    };
  }, [role, scenario]);

  // Follow the reasoning as it streams in.
  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [reasoning]);

  useImperativeHandle(ref, () => ({
    async run() {
      if (!roundId) return;
      setPhase("reasoning");
      setReasoning("");
      setDecision(null);
      setSealedCid(null);
      setError(null);
      try {
        for await (const ev of negotiate(role, roundId, scenario)) {
          if (ev.name === "reasoning") {
            setReasoning((r) => r + ev.data.text);
          } else if (ev.name === "decision") {
            setDecision({
              price: ev.data.reservation_price,
              confidence: ev.data.confidence,
              rationale: ev.data.rationale,
            });
            setPhase("decided");
          } else if (ev.name === "sealed") {
            setSealedCid(ev.data.contract_id);
            setPhase("sealed");
            onSealed(ev.data.contract_id);
            toast.success(`${meta.label} sealed`, {
              description: `${role === "customer" ? "Ceiling" : "Floor"} committed and sealed on Canton`,
            });
          } else if (ev.name === "error") {
            setError(ev.data.message);
            setPhase("error");
            toast.error(`${meta.label} failed`, { description: ev.data.message });
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Agent unreachable");
        setPhase("error");
      }
    },
  }));

  return (
    <AgentPanelView
      role={role}
      brief={context?.brief ?? null}
      showBrief={showBrief}
      onToggleBrief={() => setShowBrief((s) => !s)}
      phase={phase}
      reasoning={reasoning}
      decision={decision}
      sealedCid={sealedCid}
      error={error}
      streamRef={streamRef}
    />
  );
});
