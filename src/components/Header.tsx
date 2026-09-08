import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { NotificationsDropdown } from './NotificationsDropdown.tsx';
import { User, Settings, LogOut, ChevronDown, Flame } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { user, profile, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getPageTitle = (view: string) => {
    switch (view) {
      case 'dashboard': return 'Dashboard';
      case 'workouts': return 'Workouts & Training';
      case 'new-workout': return 'Create Workout';
      case 'active-workout': return 'Live Workout Session';
      case 'exercises': return 'Exercise Library';
      case 'progress': return 'Analytics & Progress';
      case 'goals': return 'Fitness Goals';
      case 'habits': return 'Habit Tracker';
      case 'calendar': return 'Activity Calendar';
      case 'profile': return 'My Profile';
      case 'settings': return 'Settings';
      default: return 'FitTrack';
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <Flame className="w-4 h-4 fill-current" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight capitalize">
            {getPageTitle(currentView)}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell */}
        <NotificationsDropdown />

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-emerald-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center">
                {profile?.firstName ? profile.firstName[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">
              {profile?.firstName || user?.email?.split('@')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Athlete'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  onNavigate('profile');
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
              >
                <User className="w-4 h-4 text-slate-400" />
                Profile
              </button>

              <button
                onClick={() => {
                  onNavigate('settings');
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
