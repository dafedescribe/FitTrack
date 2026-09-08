import React from 'react';
import { LayoutDashboard, Dumbbell, Plus, TrendingUp, User } from 'lucide-react';
import { cn } from '../lib/utils.ts';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenQuickAction: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate, onOpenQuickAction }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 px-4 flex items-center justify-around select-none">
      <button
        onClick={() => onNavigate('dashboard')}
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[11px] font-medium transition-colors',
          currentView === 'dashboard' ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
        )}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => onNavigate('workouts')}
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[11px] font-medium transition-colors',
          currentView === 'workouts' || currentView === 'new-workout' || currentView === 'active-workout'
            ? 'text-emerald-600 font-semibold'
            : 'text-slate-500 hover:text-slate-900'
        )}
      >
        <Dumbbell className="w-5 h-5" />
        <span>Workouts</span>
      </button>

      {/* Central Floating Quick Action Button */}
      <div className="relative -top-4">
        <button
          onClick={onOpenQuickAction}
          className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-transform"
          aria-label="Quick action"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <button
        onClick={() => onNavigate('progress')}
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[11px] font-medium transition-colors',
          currentView === 'progress' ? 'text-emerald-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
        )}
      >
        <TrendingUp className="w-5 h-5" />
        <span>Progress</span>
      </button>

      <button
        onClick={() => onNavigate('profile')}
        className={cn(
          'flex flex-col items-center justify-center gap-1 w-14 py-1 text-[11px] font-medium transition-colors',
          currentView === 'profile' || currentView === 'settings'
            ? 'text-emerald-600 font-semibold'
            : 'text-slate-500 hover:text-slate-900'
        )}
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </button>
    </nav>
  );
};
