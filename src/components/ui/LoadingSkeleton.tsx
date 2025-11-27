'use client';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

interface LoadingSkeletonProps {
  type: 'card' | 'list' | 'table' | 'stats';
  count?: number;
}

function LoadingSkeleton({ type, count = 1 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const containerProps = {
    role: 'status' as const,
    'aria-label': 'Loading content',
    'aria-busy': true,
  };

  switch (type) {
    case 'card':
      return (
        <div className="space-y-4" {...containerProps}>
          {items.map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <Skeleton className="h-4 w-1/4 mb-4" />
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className="space-y-3" {...containerProps}>
          {items.map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" {...containerProps}>
          <div className="border-b border-gray-200 p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
          {items.map((i) => (
            <div key={i} className="border-b border-gray-100 p-4 last:border-0">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'stats':
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" {...containerProps}>
          {items.map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ))}
        </div>
      );
  }
}

// Stat card skeleton for dashboard
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-8 w-3/4" />
    </div>
  );
}

// Transaction row skeleton
function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export {
  Skeleton,
  LoadingSkeleton,
  StatCardSkeleton,
  TransactionSkeleton,
  type LoadingSkeletonProps,
};
