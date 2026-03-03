import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldAlert } from "lucide-react";
import { SemaforoStatus, getSemaforoLabel, getSemaforoBadgeClass, formatPercent } from "@/data/seedData";

interface SemaforoBadgeProps {
  status: SemaforoStatus;
  pctIdeal?: number;
  compact?: boolean;
}

const icons: Record<SemaforoStatus, React.ReactNode> = {
  verde: <CheckCircle2 className="w-3 h-3" />,
  amarelo: <AlertTriangle className="w-3 h-3" />,
  laranja: <ShieldAlert className="w-3 h-3" />,
  vermelho: <AlertOctagon className="w-3 h-3" />,
};

export function SemaforoBadge({ status, pctIdeal, compact }: SemaforoBadgeProps) {
  return (
    <span className={getSemaforoBadgeClass(status)}>
      {icons[status]}
      {!compact && <span>{getSemaforoLabel(status)}</span>}
      {pctIdeal !== undefined && (
        <span className="opacity-80">· {formatPercent(pctIdeal)}</span>
      )}
    </span>
  );
}

export function SemaforoDot({ status }: { status: SemaforoStatus | null }) {
  if (!status) return <span className="w-2 h-2 rounded-full bg-secondary inline-block" />;
  return <span className={`w-2 h-2 rounded-full bg-semaforo-${status} inline-block`} />;
}
