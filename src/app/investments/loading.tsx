import { LoadingSkeleton, StatCardSkeleton } from '@/components/ui';

export default function InvestmentsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>

            {/* Holdings Table */}
            <LoadingSkeleton type="table" count={6} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <LoadingSkeleton type="card" count={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
