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
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-zinc-400">{title}</h3>
        {icon && (
          <div className="text-gray-500 dark:text-zinc-600">
            {icon}
          </div>
        )}
      </div>
      {value !== undefined && (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}