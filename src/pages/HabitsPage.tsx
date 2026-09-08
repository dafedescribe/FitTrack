import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Input } from '../components/ui/Input.tsx';
import {
  CheckCircle2,
  Plus,
  Flame,
  Trash2,
  Calendar,
  Sparkles,
  Droplets,
  Moon,
  Apple,
  Smile,
  Activity,
} from 'lucide-react';
import { Habit } from '../types.ts';
import { triggerCelebration } from '../lib/confetti.ts';

interface HabitsPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const HabitsPage: React.FC<HabitsPageProps> = ({ onNavigate }) => {
  const { apiFetch } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Habit Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hydration');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [saving, setSaving] = useState(false);

  const categories = [
    { id: 'Hydration', label: 'Hydration', icon: Droplets, color: 'text-sky-500' },
    { id: 'Nutrition', label: 'Nutrition', icon: Apple, color: 'text-emerald-500' },
    { id: 'Sleep', label: 'Sleep & Rest', icon: Moon, color: 'text-indigo-500' },
    { id: 'Stretching', label: 'Stretching & Mobility', icon: Activity, color: 'text-teal-500' },
    { id: 'Mindset', label: 'Mindset / Mental', icon: Smile, color: 'text-amber-500' },
  ];

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const list = await apiFetch('/api/habits');
      setHabits(list);
    } catch (err) {
      console.error('Failed to load habits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleToggleHabit = async (habitId: string, currentCompleted: boolean) => {
    const today = new Date().toISOString().split('T')[0];

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const newCompleted = !currentCompleted;
        return {
          ...h,
          completedToday: newCompleted,
          streak: newCompleted ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 1) - 1),
        };
      })
    );

    if (!currentCompleted) {
      triggerCelebration();
    }

    try {
      await apiFetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        body: JSON.stringify({
          date: today,
          completed: !currentCompleted,
        }),
      });
    } catch (err) {
      console.error('Failed to log habit', err);
      await fetchHabits();
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await apiFetch('/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          category,
          targetDaysPerWeek,
        }),
      });

      setCreateModalOpen(false);
      setName('');
      await fetchHabits();
    } catch (err) {
      console.error('Failed to create habit', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await apiFetch(`/api/habits/${id}`, { method: 'DELETE' });
      await fetchHabits();
    } catch (err) {
      console.error('Failed to delete habit', err);
    }
  };

  // Days of current week for consistency matrix
  const getWeekDays = () => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; // Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      days.push({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        dateStr: d.toISOString().split('T')[0],
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Habit Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build compounding daily routines for hydration, sleep, nutrition, and recovery.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Habit
        </Button>
      </div>

      {/* Today's Checklist Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Habits</h3>
              <p className="text-xs text-slate-500">Check off what you have accomplished today</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              {habits.filter((h) => h.completedToday).length} of {habits.length} done
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-200 rounded-xl" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">No habits tracked yet.</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => setCreateModalOpen(true)}
              >
                Create First Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    habit.completedToday
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleHabit(habit.id, habit.completedToday)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                        habit.completedToday
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'border-slate-300 bg-white hover:border-emerald-500'
                      }`}
                    >
                      {habit.completedToday && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          habit.completedToday ? 'text-emerald-950 line-through' : 'text-slate-900'
                        }`}
                      >
                        {habit.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="capitalize">{habit.category}</span>
                        <span>•</span>
                        <span>{habit.targetDaysPerWeek}x / week</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/60">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>{habit.streak}d</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Consistency Matrix */}
      {habits.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Weekly Consistency Matrix</h3>
            <p className="text-xs text-slate-500 mb-4">View habit compliance across the week</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="py-2.5 text-left font-medium">Habit</th>
                    {weekDays.map((d) => (
                      <th key={d.dateStr} className="py-2.5 text-center font-medium w-16">
                        {d.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {habits.map((h) => (
                    <tr key={h.id} className="text-slate-800">
                      <td className="py-3 font-semibold text-slate-900">{h.name}</td>
                      {weekDays.map((d) => {
                        const isLogged = h.history?.[d.dateStr];
                        return (
                          <td key={d.dateStr} className="py-3 text-center">
                            {isLogged ? (
                              <div className="w-6 h-6 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 mx-auto rounded-full bg-slate-100 border border-slate-200" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Habit Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="md"
        title="Create New Habit"
        description="Establish a positive daily ritual to support your athletic goals."
      >
        <form onSubmit={handleCreateHabit} className="space-y-4 pt-1">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategory(c.id);
                      if (c.id === 'Hydration') setName('Drink 3L of water');
                      if (c.id === 'Sleep') setName('8 hours of sleep');
                      if (c.id === 'Nutrition') setName('140g protein intake');
                      if (c.id === 'Stretching') setName('10 min mobility & foam roll');
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      category === c.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${c.color}`} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Habit Description"
            placeholder="e.g. Drink 3 liters of water, 10 min morning mobility"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Weekly Target</label>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTargetDaysPerWeek(num)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                    targetDaysPerWeek === num
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {num}d / wk
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saving}
            >
              Save Habit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
