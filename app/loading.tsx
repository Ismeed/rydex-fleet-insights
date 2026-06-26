import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col p-6 animate-pulse">
      {/* Top navbar skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-8">
        <div className="flex items-center space-x-3">
          {/* Spinning Brand Logo "M" */}
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-xl animate-spin">
            M
          </div>
          <div className="h-5 w-32 bg-muted rounded-md" />
        </div>
        <div className="h-9 w-24 bg-muted rounded-md" />
      </div>

      {/* Main dashboard content skeleton */}
      <div className="flex-1 max-w-7xl w-full mx-auto space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card p-5 rounded-xl border border-border space-y-3">
              <div className="h-3 w-16 bg-muted rounded-md" />
              <div className="h-7 w-28 bg-muted rounded-md" />
              <div className="h-3 w-20 bg-muted rounded-md" />
            </div>
          ))}
        </div>

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main skeleton card */}
          <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 bg-muted rounded-md" />
              <div className="h-4 w-20 bg-muted rounded-md" />
            </div>
            <div className="h-64 bg-muted/30 rounded-lg w-full flex items-end p-4 space-x-2">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-muted rounded-t" 
                  style={{ height: `${20 + Math.random() * 60}%` }} 
                />
              ))}
            </div>
          </div>

          {/* Sidebar skeleton card */}
          <div className="bg-card p-6 rounded-xl border border-border space-y-4">
            <div className="h-5 w-32 bg-muted rounded-md" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-muted rounded-md" />
                    <div className="h-3 w-16 bg-muted rounded-md" />
                  </div>
                  <div className="h-4 w-12 bg-muted rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
