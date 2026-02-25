import { cn } from "../lib/utils";

// Base skeleton component with shimmer effect
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted rounded-md",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

// Card skeleton
export function CardSkeleton({ className }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  );
}

// Banner skeleton
export function BannerSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden">
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// Stats skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg border bg-card">
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

// News card skeleton
export function NewsCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Banner */}
      <BannerSkeleton />

      {/* Stats */}
      <StatsSkeleton />

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

// Full page loading
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSkeleton />
    </div>
  );
}
