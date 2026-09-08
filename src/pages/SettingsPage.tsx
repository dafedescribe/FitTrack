import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import {
  Settings,
  Bell,
  Scale,
  Clock,
  Shield,
  Download,
  LogOut,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { settings, apiFetch, refreshSettings, sendPasswordReset, user, logout } = useAuth();
  const [weightUnit, setWeightUnit] = useState('kg');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [defaultRestTime, setDefaultRestTime] = useState(60);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (settings) {
      setWeightUnit(settings.weightUnit || 'kg');
      setDistanceUnit(settings.distanceUnit || 'km');
      setDefaultRestTime(settings.defaultRestTime || 60);
      setWorkoutReminders(settings.notificationsEnabled ?? true);
      setStreakAlerts(settings.streakReminders ?? true);
      setWeeklySummary(settings.weeklyReport ?? true);
    }
  }, [settings]);

  const handleSaveSettings = async (updates: any) => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      await refreshSettings();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordReset(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      console.error('Failed to send reset email', err);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const [workouts, measurements, goals, habits] = await Promise.all([
        apiFetch('/api/workouts'),
        apiFetch('/api/measurements'),
        apiFetch('/api/goals'),
        apiFetch('/api/habits'),
      ]);

      const backup = {
        exportDate: new Date().toISOString(),
        userEmail: user?.email,
        workouts,
        measurements,
        goals,
        habits,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure units, rest timers, and preferences.</p>
        </div>
        {savedSuccess && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Settings saved
          </span>
        )}
      </div>

      {/* Unit Preferences */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            Unit Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Weight Unit</label>
              <div className="flex gap-2">
                {['kg', 'lbs'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setWeightUnit(u);
                      handleSaveSettings({ weightUnit: u });
                    }}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                      weightUnit === u
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Distance Unit</label>
              <div className="flex gap-2">
                {['km', 'miles'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setDistanceUnit(u);
                      handleSaveSettings({ distanceUnit: u });
                    }}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                      distanceUnit === u
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Timer Preferences */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Default Rest Timer
          </h3>
          <p className="text-xs text-slate-500">
            Automatically starts between sets during an active workout session.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {[30, 60, 90, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setDefaultRestTime(sec);
                  handleSaveSettings({ defaultRestTime: sec });
                }}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  defaultRestTime === sec
                    ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {sec} seconds
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            Notifications & Reminders
          </h3>

          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Workout Reminders</p>
                <p className="text-[11px] text-slate-500">Receive gentle nudges on scheduled workout days</p>
              </div>
              <input
                type="checkbox"
                checked={workoutReminders}
                onChange={(e) => {
                  setWorkoutReminders(e.target.checked);
                  handleSaveSettings({ notificationsEnabled: e.target.checked });
                }}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Streak Alerts</p>
                <p className="text-[11px] text-slate-500">Notifications before you lose your daily streak</p>
              </div>
              <input
                type="checkbox"
                checked={streakAlerts}
                onChange={(e) => {
                  setStreakAlerts(e.target.checked);
                  handleSaveSettings({ streakReminders: e.target.checked });
                }}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Weekly Summary</p>
                <p className="text-[11px] text-slate-500">Sunday digest of total volume, workouts, and PRs</p>
              </div>
              <input
                type="checkbox"
                checked={weeklySummary}
                onChange={(e) => {
                  setWeeklySummary(e.target.checked);
                  handleSaveSettings({ weeklyReport: e.target.checked });
                }}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security & Data */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-700" />
            Security & Backup
          </h3>

          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-900">Reset Account Password</p>
                <p className="text-[11px] text-slate-500">Send password recovery link to {user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasswordReset}
                className="text-xs"
              >
                <Lock className="w-3.5 h-3.5 mr-1" />
                {resetSent ? 'Link Sent!' : 'Send Reset Link'}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-900">Export Fitness Data</p>
                <p className="text-[11px] text-slate-500">Download a full JSON backup of all workouts, logs, and habits</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                isLoading={exporting}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download Backup
              </Button>
            </div>

            <div className="pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={logout}
                className="text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Sign Out of FitTrack
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
