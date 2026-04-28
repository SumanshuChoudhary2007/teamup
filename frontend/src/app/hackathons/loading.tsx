'use client';

import { HackathonSkeleton, Skeleton } from '@/components/Skeleton';
import { Trophy } from 'lucide-react';

export default function HackathonsLoading() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="relative z-10 mb-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#a78bfa] text-xs font-bold uppercase tracking-widest mb-4">
            <Trophy className="w-4 h-4 opacity-20" />
            <Skeleton className="w-32 h-4" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 flex justify-center">
            <Skeleton className="w-3/4 h-14" />
          </h1>
          <Skeleton className="w-full h-4" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <Skeleton className="flex-1 h-14 rounded-2xl" />
          <Skeleton className="w-40 h-14 rounded-2xl" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <HackathonSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
