import React from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  TrendingUp,
  Target,
  CheckCircle2,
  Calendar,
  User,
  Settings,
  LogOut,
  Flame,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { cn } from '../lib/utils.ts';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenQuickAction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onOpenQuickAction }) => {
  const { user, profile, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'exercises', label: 'Exercises', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'habits', label: 'Habits', icon: CheckCircle2 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  const secondaryNav = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/90 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1">
              FitTrack
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">PRO</span>
            </span>
          </div>
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onOpenQuickAction}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-xs shadow-emerald-600/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Log</span>
        </button>
      </div>

      {/* Main Nav Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-emerald-600' : 'text-slate-400')} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Preferences
        </div>
        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-emerald-600' : 'text-slate-400')} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-emerald-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center shrink-0">
                {profile?.firstName ? profile.firstName[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user?.email?.split('@')[0] || 'Athlete'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
