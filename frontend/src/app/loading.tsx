'use client';

import { Skeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-3">
          <Skeleton className="w-48 h-10" />
          <Skeleton className="w-64 h-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-32 h-12" />
          <Skeleton className="w-32 h-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <Skeleton className="w-16 h-6" />
            </div>
            <Skeleton className="w-3/4 h-6" />
            <Skeleton className="w-full h-12" />
            <div className="pt-4 border-t border-white/5 flex justify-between">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
