interface DashboardCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  emoji?: string;
}

export default function DashboardCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  children, 
  className = "",
  emoji
}: DashboardCardProps) {
  return (
    <div className={`relative bg-white rounded-2xl border-3 border-cyan-400 p-6 hover:scale-[1.02] transition-transform ${className}`}>
      {/* Decorative corner */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg transform rotate-12 shadow-lg"></div>
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-2xl">{emoji}</span>}
          <h3 className="font-['Rubik_Mono_One'] text-sm text-cyan-700 text-cyan-300 uppercase">{title}</h3>
        </div>
        {icon && (
          <div className="text-cyan-600 text-cyan-400">
            {icon}
          </div>
        )}
      </div>
      {value !== undefined && (
        <div className="space-y-1">
          <p className="text-3xl font-dm-mono font-black bg-gradient-to-r from-cyan-600 to-teal-600 from-cyan-400 to-teal-400 bg-clip-text text-transparent">{value}</p>
          {subtitle && (
            <p className="text-sm font-['Rubik_Mono_One'] text-gray-600 text-gray-400">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}