import { LoadingSkeleton, StatCardSkeleton } from '@/components/ui';

export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-40 bg-white/20 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-white/20 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Transactions List Skeleton */}
        <LoadingSkeleton type="table" count={10} />
      </div>
    </div>
  );
}
