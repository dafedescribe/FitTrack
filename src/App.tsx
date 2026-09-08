import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { QuickActionModal } from './components/QuickActionModal.tsx';
import { RecordWeightModal } from './components/RecordWeightModal.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { WorkoutsPage } from './pages/WorkoutsPage.tsx';
import { NewWorkoutPage } from './pages/NewWorkoutPage.tsx';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage.tsx';
import { ExercisesPage } from './pages/ExercisesPage.tsx';
import { ProgressPage } from './pages/ProgressPage.tsx';
import { GoalsPage } from './pages/GoalsPage.tsx';
import { HabitsPage } from './pages/HabitsPage.tsx';
import { CalendarPage } from './pages/CalendarPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

import { Workout } from './types.ts';

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [recordWeightOpen, setRecordWeightOpen] = useState(false);

  // Active workout session tracker
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | undefined>(undefined);

  // Auto-route on auth state changes
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (profile && profile.onboardingCompleted === false) {
          setCurrentView('onboarding');
        } else if (currentView === 'landing' || currentView === 'login' || currentView === 'signup') {
          setCurrentView('dashboard');
        }
      } else {
        if (currentView !== 'login' && currentView !== 'signup' && currentView !== 'forgot-password') {
          setCurrentView('landing');
        }
      }
    }
  }, [user, profile, loading]);

  const handleNavigate = (view: string, data?: any) => {
    if (data?.selectedWorkoutId) {
      setSelectedWorkoutId(data.selectedWorkoutId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartWorkout = (workout: Workout | any) => {
    setActiveWorkoutId(workout.id);
    setCurrentView('active-workout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide">Loading FitTrack...</p>
        </div>
      </div>
    );
  }

  // Public unauthenticated views
  if (!user) {
    if (currentView === 'login') {
      return <LoginPage onNavigate={handleNavigate} />;
    }
    if (currentView === 'signup') {
      return <SignupPage onNavigate={handleNavigate} />;
    }
    if (currentView === 'forgot-password') {
      return <ForgotPasswordPage onNavigate={handleNavigate} />;
    }
    return <LandingPage onNavigate={handleNavigate} />;
  }

  // Onboarding flow
  if (currentView === 'onboarding') {
    return <OnboardingPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Sticky Header */}
        <Header currentView={currentView} onNavigate={handleNavigate} />

        {/* Dynamic View Route Container */}
        <main className="flex-1 overflow-x-hidden">
          {currentView === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenRecordWeight={() => setRecordWeightOpen(true)}
              onStartWorkout={handleStartWorkout}
            />
          )}

          {currentView === 'workouts' && (
            <WorkoutsPage
              onNavigate={handleNavigate}
              onStartWorkout={handleStartWorkout}
              initialSelectedId={selectedWorkoutId}
            />
          )}

          {currentView === 'new-workout' && (
            <NewWorkoutPage
              onNavigate={handleNavigate}
              onStartWorkout={handleStartWorkout}
            />
          )}

          {currentView === 'active-workout' && activeWorkoutId && (
            <ActiveWorkoutPage
              workoutId={activeWorkoutId}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'exercises' && (
            <ExercisesPage onNavigate={handleNavigate} />
          )}

          {currentView === 'progress' && (
            <ProgressPage
              onNavigate={handleNavigate}
              onOpenRecordWeight={() => setRecordWeightOpen(true)}
            />
          )}

          {currentView === 'goals' && (
            <GoalsPage onNavigate={handleNavigate} />
          )}

          {currentView === 'habits' && (
            <HabitsPage onNavigate={handleNavigate} />
          )}

          {currentView === 'calendar' && (
            <CalendarPage onNavigate={handleNavigate} />
          )}

          {currentView === 'profile' && (
            <ProfilePage onNavigate={handleNavigate} />
          )}

          {currentView === 'settings' && (
            <SettingsPage onNavigate={handleNavigate} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenQuickAction={() => setQuickActionOpen(true)}
      />

      {/* Global Quick Actions Modal */}
      <QuickActionModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
        onNavigate={handleNavigate}
        onOpenRecordWeight={() => {
          setQuickActionOpen(false);
          setRecordWeightOpen(true);
        }}
      />

      {/* Global Weight & Measurement Record Modal */}
      <RecordWeightModal
        isOpen={recordWeightOpen}
        onClose={() => setRecordWeightOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
