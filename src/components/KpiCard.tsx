import { ReactNode } from "react";
import { cn } from "./ui/utils";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  backgroundClass?: string;
  toneClass?: string;
  footer?: ReactNode;
};

export function KpiCard({
  label,
  value,
  subtitle,
  icon,
  backgroundClass = "bg-card",
  toneClass = "text-foreground",
  footer,
}: KpiCardProps) {
  return (
    <div className={cn("p-4 rounded-lg shadow-sm border", backgroundClass)}>
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn("text-2xl font-semibold", toneClass)}>{value}</div>
      {subtitle ? <div className="text-xs text-muted-foreground mt-1">{subtitle}</div> : null}
      {footer ? <div className="text-sm text-muted-foreground mt-2">{footer}</div> : null}
    </div>
  );
}
