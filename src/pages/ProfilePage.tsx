import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import {
  User,
  Trophy,
  Flame,
  Calendar,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../lib/utils.ts';
import { Achievement } from '../types.ts';

interface ProfilePageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { profile, user, apiFetch, refreshProfile, settings } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
  const [primaryGoal, setPrimaryGoal] = useState('Build muscle');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(4);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setHeight(profile.height ? String(profile.height) : '');
      setCurrentWeight(profile.currentWeight ? String(profile.currentWeight) : '');
      setTargetWeight(profile.targetWeight ? String(profile.targetWeight) : '');
      setFitnessLevel(profile.fitnessLevel || 'Intermediate');
      setPrimaryGoal(profile.primaryGoal || 'Build muscle');
      setWorkoutsPerWeek(profile.workoutsPerWeek || 4);
    }
  }, [profile]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const list = await apiFetch('/api/achievements');
        setAchievements(list);
      } catch (err) {
        console.error('Failed to load achievements', err);
      }
    };
    fetchAchievements();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName,
          height: height ? parseFloat(height) : null,
          currentWeight: currentWeight ? parseFloat(currentWeight) : null,
          targetWeight: targetWeight ? parseFloat(targetWeight) : null,
          fitnessLevel,
          primaryGoal,
          workoutsPerWeek: parseInt(String(workoutsPerWeek)),
        }),
      });

      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-3xl font-extrabold shadow-inner">
            {firstName ? firstName[0].toUpperCase() : 'A'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {firstName ? `${firstName} ${lastName}`.trim() : 'Athlete Profile'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
                {fitnessLevel} Level
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
                Goal: {primaryGoal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500">Update your stats, goals, and training frequency</p>
            </div>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Profile updated successfully!
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Height (cm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="178"
              />
              <Input
                label={`Current Weight (${settings?.weightUnit || 'kg'})`}
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="75"
              />
              <Input
                label={`Target Weight (${settings?.weightUnit || 'kg'})`}
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="72"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fitness Level</label>
                <select
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Goal</label>
                <select
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Lose weight">Lose weight</option>
                  <option value="Build muscle">Build muscle</option>
                  <option value="Get stronger">Get stronger</option>
                  <option value="Improve fitness">Improve fitness</option>
                  <option value="Improve endurance">Improve endurance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workouts / Week</label>
                <select
                  value={workoutsPerWeek}
                  onChange={(e) => setWorkoutsPerWeek(parseInt(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} days / week</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button type="submit" variant="primary" isLoading={saving}>
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Achievements Showcase */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Achievements & Badges
              </h3>
              <p className="text-xs text-slate-500">
                Unlocked {unlockedCount} of {achievements.length} badges
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {Math.round((unlockedCount / (achievements.length || 1)) * 100)}% Complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  a.unlocked
                    ? 'border-amber-200 bg-amber-50/40 text-slate-900 shadow-xs'
                    : 'border-slate-100 bg-slate-50/60 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    a.unlocked ? 'bg-amber-100 text-amber-700 shadow-xs' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {a.unlocked ? (a.badgeIcon || '🏆') : <Lock className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900">{a.name}</p>
                    {a.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{a.description}</p>
                  {a.unlocked && a.unlockedAt && (
                    <span className="text-[10px] text-amber-700 font-semibold mt-1 block">
                      Unlocked {formatDate(a.unlockedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
