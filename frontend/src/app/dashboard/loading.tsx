'use client';

import { DashboardSkeleton, Skeleton } from '@/components/Skeleton';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="relative z-10 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-[#a78bfa] opacity-20" />
              <Skeleton className="w-48 h-10" />
            </h1>
            <Skeleton className="w-64 h-4 mt-2" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="w-32 h-12 rounded-xl" />
            <Skeleton className="w-32 h-12 rounded-xl" />
          </div>
        </div>
      </div>
      
      <div className="relative z-10">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
