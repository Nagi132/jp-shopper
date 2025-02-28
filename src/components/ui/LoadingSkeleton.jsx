// src/components/ui/LoadingSkeleton.jsx (if it doesn't already have dashboard skeleton)
export function DashboardSkeleton() {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border rounded-xl p-4">
              <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="border rounded-xl p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
              <div className="space-y-2">
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }