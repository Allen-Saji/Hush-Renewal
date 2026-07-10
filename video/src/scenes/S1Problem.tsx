import { AbsoluteFill } from "remotion";
import { TrendUp, SquaresFour, ArrowsVertical } from "@phosphor-icons/react";
import { MaskBars } from "@/components/ui/MaskBars";
import { Appear } from "../lib/Appear";

function StatCard({
  icon,
  value,
  label,
  cite,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  cite: string;
}) {
  return (
    <div className="flex-1 rounded-card border border-line bg-surface p-8">
      <div className="flex items-center gap-3 text-accent">{icon}</div>
      <div className="mt-4 text-6xl font-bold tracking-tight text-ink">{value}</div>
      <div className="mt-2 text-xl text-muted">{label}</div>
      <div className="mt-4 text-sm text-faint">{cite}</div>
    </div>
  );
}

export function S1Problem() {
  return (
    <AbsoluteFill className="bg-bg justify-center px-32 py-20 font-sans text-ink">
      <Appear at={0.3}>
        <h1 className="text-5xl font-bold tracking-tight">
          Enterprise SaaS renewals are a standoff
        </h1>
      </Appear>

      <div className="mt-12 flex gap-8">
        <Appear at={0.9} className="flex-1">
          <StatCard
            icon={<SquaresFour size={36} weight="bold" />}
            value="305"
            label="SaaS applications managed by the average company"
            cite="Zylo, 2026 SaaS Management Index"
          />
        </Appear>
        <Appear at={4.0} className="flex-1">
          <StatCard
            icon={<TrendUp size={36} weight="bold" />}
            value="+13.2% / yr"
            label="SaaS price inflation at renewal"
            cite="Vertice SaaS Inflation Index, Mar 2026"
          />
        </Appear>
      </div>

      {/* The standoff: ceiling vs floor, both hidden */}
      <Appear at={7.0} className="mt-12">
        <div className="rounded-card border border-line bg-surface px-10 py-8">
          <div className="flex items-center justify-between gap-10">
            <div>
              <div className="text-[0.8rem] font-medium uppercase tracking-[0.14em] text-faint">
                Buyer
              </div>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-2xl font-semibold">has a ceiling</span>
                <MaskBars tone="ink" />
              </div>
            </div>
            <Appear at={11.2} from="none">
              <div className="flex flex-col items-center gap-1 text-faint">
                <ArrowsVertical size={30} weight="bold" />
                <span className="text-base">neither will go first</span>
              </div>
            </Appear>
            <div className="text-right">
              <div className="text-[0.8rem] font-medium uppercase tracking-[0.14em] text-faint">
                Vendor
              </div>
              <div className="mt-2 flex items-center gap-4">
                <MaskBars tone="ink" />
                <span className="text-2xl font-semibold">has a floor</span>
              </div>
            </div>
          </div>
        </div>
      </Appear>
    </AbsoluteFill>
  );
}
