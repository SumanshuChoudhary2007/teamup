'use client';

import { TeamSkeleton, Skeleton } from '@/components/Skeleton';
import { Users } from 'lucide-react';

export default function TeamsLoading() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-[#a78bfa] opacity-20" />
              <Skeleton className="w-48 h-10" />
            </h1>
            <Skeleton className="w-64 h-4 mt-2" />
          </div>
          <Skeleton className="w-32 h-12 rounded-xl" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Skeleton className="flex-1 h-14 rounded-2xl" />
          <Skeleton className="w-40 h-14 rounded-2xl" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <TeamSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
