
import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 animate-pulse">
    <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
    <div className="h-10 w-48 bg-slate-100 rounded"></div>
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-12 w-full bg-slate-100 rounded-2xl"></div>
    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden p-8 space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-6">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-100 rounded"></div>
            <div className="h-3 w-24 bg-slate-50 rounded"></div>
          </div>
          <div className="h-4 w-32 bg-slate-100 rounded"></div>
          <div className="h-8 w-8 bg-slate-50 rounded-full"></div>
        </div>
      ))}
    </div>
  </div>
);
