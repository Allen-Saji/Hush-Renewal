/*
  Typed access to the captured production round. Everything the scenes
  display -- briefs, reasoning, prices, contract ids, probe results --
  comes from this one real Canton DevNet round (plus one throwaway round
  for the force-bad-settlement probe).
*/
import raw from "../fixtures/round.json";
import type {
  Clearing,
  ContractView,
  CustomerAccept,
  ForceBadSettlementResult,
  PeekResult,
  Round,
  Settlement,
} from "@/lib/api";

type AgentSide = "customer" | "vendor";

export type Fixture = {
  round: Round;
  briefs: Record<AgentSide, Record<string, unknown>>;
  reasoning: Record<AgentSide, string>;
  decisions: Record<AgentSide, { price: string; confidence: number; rationale: string }>;
  sealedCids: Record<AgentSide, string>;
  clearing: Clearing;
  settlement: Record<
    AgentSide,
    { role: AgentSide; round_id: string; rationale: string; result: Record<string, string> }
  >;
  projections: Record<"customer" | "vendor" | "matcher", ContractView[]>;
  peek: PeekResult;
  force: ForceBadSettlementResult;
  ids: { packageId: string; matcher: string; customer: string; vendor: string };
};

export const fixture = raw as unknown as Fixture;

export const customerAccept: CustomerAccept = {
  accepted_contract_id: fixture.settlement.customer.result.accepted_contract_id,
  cash_contract_id: fixture.settlement.customer.result.cash_contract_id,
};

export const settled: Settlement = {
  license_contract_id: fixture.settlement.vendor.result.license_contract_id,
  vendor_cash_contract_id: fixture.settlement.vendor.result.vendor_cash_contract_id,
};

/** Position of the deal price inside [floor, ceiling], 0..1. */
export const bandPosition = (() => {
  const floor = Number(fixture.decisions.vendor.price);
  const ceiling = Number(fixture.decisions.customer.price);
  const price = Number(fixture.clearing.price);
  return (price - floor) / (ceiling - floor);
})();
