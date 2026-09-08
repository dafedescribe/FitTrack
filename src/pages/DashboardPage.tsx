import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import {
  Flame,
  Dumbbell,
  Timer,
  Trophy,
  Play,
  Plus,
  Scale,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DashboardData, Workout } from '../types.ts';
import { formatDate } from '../lib/utils.ts';

interface DashboardPageProps {
  onNavigate: (view: string, data?: any) => void;
  onOpenRecordWeight: () => void;
  onStartWorkout: (workout: Workout) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenRecordWeight,
  onStartWorkout,
}) => {
  const { apiFetch, user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.firstName || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete';

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl" />
          <div className="h-72 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    workoutsThisWeek: 0,
    totalWorkoutMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievementsEarned: 0,
  };

  const targetWorkouts = profile?.workoutsPerWeek || 4;
  const todayWorkout = data?.todayWorkout;
  const primaryGoal = data?.primaryGoal;

  // Calculate goal percentage
  let goalPercent = 0;
  if (primaryGoal) {
    if (primaryGoal.goalType === 'weight') {
      const initial = profile?.currentWeight || primaryGoal.currentValue || 80;
      const target = primaryGoal.targetValue;
      const cur = primaryGoal.currentValue || initial;
      if (initial !== target) {
        goalPercent = Math.min(100, Math.max(0, Math.round(((initial - cur) / (initial - target)) * 100)));
      } else {
        goalPercent = 100;
      }
    } else if (primaryGoal.targetValue > 0) {
      goalPercent = Math.min(100, Math.max(0, Math.round((primaryGoal.currentValue / primaryGoal.targetValue) * 100)));
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-24 md:pb-12">
      {/* Top Greeting & Motivation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {stats.currentStreak > 0
              ? `You are on a ${stats.currentStreak}-day workout streak. Consistency creates champions!`
              : "Let's get moving today and kick off a brand-new streak."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onOpenRecordWeight}
            className="text-xs"
          >
            <Scale className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Log Weight
          </Button>
          <Button
            variant="primary"
            onClick={() => onNavigate('new-workout')}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Workout
          </Button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workouts This Week */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Week</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Dumbbell className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats.workoutsThisWeek}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">/ {targetWorkouts} sessions</span>
            </div>
            <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.workoutsThisWeek / targetWorkouts) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Time */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workout Time</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats.totalWorkoutMinutes >= 60
                  ? `${Math.floor(stats.totalWorkoutMinutes / 60)}h ${stats.totalWorkoutMinutes % 60}m`
                  : `${stats.totalWorkoutMinutes}m`}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-medium">Logged this week</p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="hover:shadow-md transition-shadow border-orange-200/60 bg-gradient-to-br from-white to-orange-50/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Workout Streak</span>
              <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <Flame className="w-4 h-4 fill-current" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="mt-2 text-xs text-orange-600 font-semibold">
              Best: {stats.longestStreak} days
            </p>
          </CardContent>
        </Card>

        {/* Achievements Earned */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Badges Earned</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats.achievementsEarned}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">unlocked</span>
            </div>
            <p className="mt-2 text-xs text-amber-600 font-semibold">Keep crushing milestones</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Today's Workout & Weekly Activity & Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout Focus (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Workout Action Card */}
          <Card className="border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/40 relative overflow-hidden">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Today's Training</span>
                </div>
                {todayWorkout && (
                  <Badge variant={todayWorkout.status === 'completed' ? 'success' : todayWorkout.status === 'in_progress' ? 'warning' : 'secondary'}>
                    {todayWorkout.status === 'completed' ? 'Completed' : todayWorkout.status === 'in_progress' ? 'In Progress' : 'Planned'}
                  </Badge>
                )}
              </div>

              {todayWorkout ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{todayWorkout.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 capitalize">
                      {todayWorkout.workoutType} routine • {todayWorkout.exerciseCount || 0} exercises planned
                    </p>
                  </div>

                  {todayWorkout.status === 'completed' ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Workout finished for today! Log another session anytime or review your workout history.</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        size="md"
                        variant="primary"
                        onClick={() => onStartWorkout(todayWorkout)}
                        className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                      >
                        <Play className="w-4 h-4 fill-current mr-1.5" />
                        {todayWorkout.status === 'in_progress' ? 'Resume Session' : 'Start Workout'}
                      </Button>
                      <Button
                        size="md"
                        variant="outline"
                        onClick={() => onNavigate('workouts')}
                      >
                        View Exercises
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-3 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">No workout scheduled for today</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Ready to move? Launch a quick workout session or build a new routine from 30+ exercises.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      size="md"
                      variant="primary"
                      onClick={() => onNavigate('new-workout')}
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Plan or Start Workout
                    </Button>
                    <Button
                      size="md"
                      variant="outline"
                      onClick={() => onNavigate('exercises')}
                    >
                      Browse Exercise Library
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Consistency Activity Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Weekly Consistency</h4>
                  <p className="text-xs text-slate-500">Track workout completion across the current week</p>
                </div>
                <button
                  onClick={() => onNavigate('calendar')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Full Calendar
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center pt-2">
                {data?.weekActivity.map((day) => (
                  <div
                    key={day.day}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center ${
                      day.completed
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                        : day.isToday
                        ? 'border-slate-400 bg-slate-100/70 font-semibold'
                        : 'border-slate-100 bg-slate-50/50 text-slate-400'
                    }`}
                  >
                    <span className="text-xs uppercase">{day.day}</span>
                    <div className="my-2">
                      {day.completed ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] ${day.isToday ? 'border-emerald-500 text-emerald-600 font-bold' : 'border-slate-200'}`}>
                          {day.isToday ? 'TODAY' : '—'}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {day.date.split('-')[2]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Goal Progress & Quick Actions */}
        <div className="space-y-6">
          {/* Goal Progress Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-slate-900">Primary Goal</h4>
                <button
                  onClick={() => onNavigate('goals')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Manage Goals
                </button>
              </div>

              {primaryGoal ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{primaryGoal.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target: {primaryGoal.targetValue} {primaryGoal.unit}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>Progress</span>
                      <span>{goalPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${goalPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                    <span>Current: <span className="font-bold text-slate-800">{primaryGoal.currentValue || 0} {primaryGoal.unit}</span></span>
                    {primaryGoal.deadline && (
                      <span className="text-[11px] text-slate-400">Due: {formatDate(primaryGoal.deadline)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 mb-3">No active goal set yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate('goals')}
                  >
                    Set a Fitness Target
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Shortcuts */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-base font-bold text-slate-900 mb-3">Quick Shortcuts</h4>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onNavigate('new-workout')}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all group"
                >
                  <Dumbbell className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800">New Workout</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Build routine</p>
                </button>

                <button
                  onClick={onOpenRecordWeight}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-teal-400 hover:bg-teal-50/40 text-left transition-all group"
                >
                  <Scale className="w-4 h-4 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800">Log Weight</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Record scale</p>
                </button>

                <button
                  onClick={() => onNavigate('habits')}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all group"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800">Daily Habits</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Check off tasks</p>
                </button>

                <button
                  onClick={() => onNavigate('progress')}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all group"
                >
                  <TrendingUp className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800">Analytics</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">View charts</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Workouts Feed */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Recent Workout History</h4>
              <p className="text-xs text-slate-500">Your latest logged training sessions</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('workouts')}
              className="text-emerald-600 text-xs"
            >
              View All Workouts
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {!data?.recentWorkouts || data.recentWorkouts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Dumbbell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No workouts recorded yet.</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => onNavigate('new-workout')}
              >
                Log Your First Workout
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 rounded-xl px-2 transition-colors cursor-pointer"
                  onClick={() => {
                    if (w.status === 'in_progress') {
                      onStartWorkout(w);
                    } else {
                      onNavigate('workouts', { selectedWorkoutId: w.id });
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                      <Dumbbell className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{w.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="capitalize">{w.workoutType}</span>
                        <span>•</span>
                        <span>{formatDate(w.completedAt || w.createdAt)}</span>
                        {w.durationMinutes > 0 && (
                          <>
                            <span>•</span>
                            <span>{w.durationMinutes} min</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        w.status === 'completed'
                          ? 'success'
                          : w.status === 'in_progress'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {w.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
