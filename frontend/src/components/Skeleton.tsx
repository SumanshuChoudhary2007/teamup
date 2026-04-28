'use client';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  );
}

export function HackathonSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-16 h-6" />
      </div>
      <Skeleton className="w-3/4 h-8" />
      <Skeleton className="w-full h-12" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6" />
        <Skeleton className="w-16 h-6" />
        <Skeleton className="w-16 h-6" />
      </div>
      <div className="pt-4 border-t border-white/5 flex justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-20 h-4" />
      </div>
    </div>
  );
}

export function TeamSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-16 h-6" />
      </div>
      <Skeleton className="w-1/2 h-6" />
      <Skeleton className="w-full h-4" />
      <div className="flex gap-2">
        <Skeleton className="w-12 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
      <div className="pt-4 border-t border-white/5 flex justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
  );
}

export function DeveloperSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col items-center space-y-4">
      <Skeleton className="w-24 h-24 rounded-2xl" />
      <Skeleton className="w-32 h-6" />
      <Skeleton className="w-24 h-4" />
      <div className="flex gap-2">
        <Skeleton className="w-12 h-4" />
        <Skeleton className="w-12 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
      <div className="w-full pt-4 border-t border-white/5 flex justify-center gap-4">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass rounded-2xl p-5 space-y-3">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="w-12 h-8" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-24 h-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <TeamSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
