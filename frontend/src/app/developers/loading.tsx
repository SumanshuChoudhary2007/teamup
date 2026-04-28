'use client';

import { DeveloperSkeleton, Skeleton } from '@/components/Skeleton';
import { Users } from 'lucide-react';

export default function DevelopersLoading() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex justify-center mb-4">
             <Skeleton className="w-48 h-10" />
          </div>
          <Skeleton className="w-full h-4 mx-auto" />
        </div>

        <div className="max-w-xl mx-auto mb-12">
          <Skeleton className="w-full h-14 rounded-2xl" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <DeveloperSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
