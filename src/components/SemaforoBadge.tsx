import { CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react";
import { SemaforoStatus, getSemaforoLabel, getSemaforoBadgeClass, formatPercent } from "@/data/seedData";
import { cn } from "@/lib/utils";

interface SemaforoBadgeProps {
  status: SemaforoStatus;
  pctIdeal?: number;
  compact?: boolean;
}

const icons: Record<SemaforoStatus, React.ReactNode> = {
  verde: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
  amarelo: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
  laranja: <ShieldAlert className="w-3.5 h-3.5 shrink-0" />,
  vermelho: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
};

export function SemaforoBadge({ status, pctIdeal, compact }: SemaforoBadgeProps) {
  return (
    <span className={cn(getSemaforoBadgeClass(status), "inline-flex items-center gap-1.5 whitespace-nowrap")}>
      {icons[status]}
      {!compact && <span className="leading-none">{getSemaforoLabel(status)}</span>}
      {pctIdeal !== undefined && (
        <span className="opacity-80 leading-none">· {formatPercent(pctIdeal)}</span>
      )}
    </span>
  );
}

export function SemaforoDot({ status }: { status: SemaforoStatus | null }) {
  if (!status) return <span className="w-2 h-2 rounded-full bg-secondary inline-block" />;
  return <span className={`w-2 h-2 rounded-full bg-semaforo-${status} inline-block`} />;
}
