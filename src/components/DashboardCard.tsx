interface DashboardCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function DashboardCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  children, 
  className = "" 
}: DashboardCardProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</h3>
        {icon && (
          <div className="text-zinc-400 dark:text-zinc-600">
            {icon}
          </div>
        )}
      </div>
      {value !== undefined && (
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}