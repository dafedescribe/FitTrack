import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/ui/Button.tsx';
import {
  Flame,
  Dumbbell,
  TrendingUp,
  Target,
  CheckCircle2,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Calendar,
  Sparkles,
  BarChart3,
  Clock,
  Heart,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">FitTrack</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
            <a href="#analytics" className="hover:text-emerald-600 transition-colors">Analytics</a>
            <a href="#habits" className="hover:text-emerald-600 transition-colors">Habits & Streaks</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="primary" onClick={() => onNavigate('dashboard')}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onNavigate('login')}>
                  Sign In
                </Button>
                <Button variant="primary" onClick={() => onNavigate('signup')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full-Stack Fitness & Wellness Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Your Fitness Journey.{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Tracked.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Track workouts in real-time, build powerful healthy habits, monitor body composition, and visualize your strength progress — all in one seamless place.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Button
                size="lg"
                variant="primary"
                onClick={() => onNavigate(user ? 'dashboard' : 'signup')}
                className="w-full sm:w-auto shadow-md shadow-emerald-600/25"
              >
                Start Tracking Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center font-medium rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 px-6 py-3 text-base transition-colors"
              >
                See How It Works
              </a>
            </div>

            {/* Social Proof Tags */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Real PostgreSQL Database
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" /> Dynamic Streaks & Badges
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Instant Rest Timers & Autosave
              </span>
            </div>
          </div>

          {/* App Preview Mockup Box */}
          <div className="mt-14 relative mx-auto max-w-5xl rounded-3xl p-3 sm:p-4 bg-slate-900/5 ring-1 ring-slate-900/10 shadow-2xl backdrop-blur-xs">
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-inner">
              {/* Fake App Header Bar */}
              <div className="h-10 bg-slate-100 border-b border-slate-200/80 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs text-slate-400 font-mono">fittrack.app/dashboard</div>
                <div className="w-12" />
              </div>

              {/* Showcase Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/50">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Workouts This Week</span>
                    <Dumbbell className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">4</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Goal: 4 per week</p>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-full rounded-full" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Active Streak</span>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">7 Days</p>
                  <p className="text-xs text-orange-600 font-semibold mt-1">🔥 On fire this week!</p>
                  <div className="flex gap-1.5 mt-3">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <div key={i} className="flex-1 h-2 rounded-full bg-orange-500" />
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Volume Moved</span>
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">18,450 kg</p>
                  <p className="text-xs text-teal-600 font-semibold mt-1">+14% vs last week</p>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-teal-500 h-full w-3/4 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Everything You Need to Reach Your Peak
            </h2>
            <p className="mt-4 text-slate-600">
              Designed from the ground up to replace clunky spreadsheets, generic notes apps, and bloated subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Live Workout Tracking</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Log sets, weights, reps, and distances in real time. Features an automatic rest timer and instant database autosaving.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-11 w-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Progress & Analytics</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Interactive charts visualizing weight change over time, workout consistency, volume lifted, and exercise 1RM progression.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-11 w-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Goal Milestones</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Set and track custom targets for weight loss, muscle gain, workout streaks, and running distance with visual progress bars.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Habit Tracking</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Build holistic lifestyle habits like hydration, stretching, sleep, and nutrition with daily checklists and weekly grids.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-11 w-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Streaks & Consistency</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Stay accountable with smart streak calculations that reward daily discipline and protect you from losing momentum.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-11 w-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Achievements & Badges</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Unlock badges and celebrate milestones like your first workout, 7-day streak, 50 workouts, and personal strength records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Simple 4-Step Training Flow
            </h2>
            <p className="mt-4 text-slate-600">
              Zero friction from opening the app to finishing your workout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Set Your Goal', desc: 'Define your target weight, weekly workout frequency, or strength benchmarks.' },
              { step: '2', title: 'Start Workout', desc: 'Pick from 30+ exercises or your custom routines with pre-filled weights and reps.' },
              { step: '3', title: 'Track Live Sets', desc: 'Tap checkmarks as you complete sets, with auto-calculating rest countdown timers.' },
              { step: '4', title: 'Celebrate & Repeat', desc: 'Review completed volume, level up your streak, and unlock new achievements.' },
            ].map((s) => (
              <div key={s.step} className="p-6 rounded-2xl bg-white border border-slate-200/80 relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-lg flex items-center justify-center border border-emerald-200/60 mb-4">
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to reach your personal best?
          </h2>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">
            Join FitTrack today. Completely free, no ads, powered by real PostgreSQL persistence.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => onNavigate(user ? 'dashboard' : 'signup')}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-8 shadow-xl shadow-emerald-500/20"
            >
              Get Started Now — It’s Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span className="font-semibold text-slate-700">FitTrack Fitness Tracker</span>
          </div>
          <p>© {new Date().getFullYear()} FitTrack. All rights reserved. Built for athletes & everyday movers.</p>
        </div>
      </footer>
    </div>
  );
};
