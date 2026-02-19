interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
}

export function AnalyticsCard({ title, value, subtitle, icon }: AnalyticsCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold text-jazz-dark dark:text-white">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  );
}
