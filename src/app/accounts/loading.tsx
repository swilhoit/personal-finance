import { LoadingSkeleton, StatCardSkeleton } from '@/components/ui';

export default function AccountsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Accounts List Skeleton */}
        <div className="space-y-6">
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
            <LoadingSkeleton type="list" count={3} />
          </div>
          <div>
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-3" />
            <LoadingSkeleton type="list" count={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
