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
  className = "",
}: DashboardCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {icon && (
          <div className="text-gray-600">
            {icon}
          </div>
        )}
      </div>
      {value !== undefined && (
        <div className="space-y-1">
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
