import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Input } from '../components/ui/Input.tsx';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  Edit2,
  Trash2,
  Trophy,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Goal } from '../types.ts';
import { formatDate } from '../lib/utils.ts';
import { triggerCelebration } from '../lib/confetti.ts';

interface GoalsPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({ onNavigate }) => {
  const { apiFetch, settings } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  // Create Goal Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [goalType, setGoalType] = useState('weight');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unit, setUnit] = useState(settings?.weightUnit || 'kg');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  // Update Progress Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newProgressVal, setNewProgressVal] = useState('');

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const list = await apiFetch('/api/goals');
      setGoals(list);
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetValue) return;

    setSaving(true);
    try {
      await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          goalType,
          title,
          description,
          targetValue: parseFloat(targetValue),
          currentValue: currentValue ? parseFloat(currentValue) : 0,
          unit,
          deadline: deadline || null,
        }),
      });

      setCreateModalOpen(false);
      resetForm();
      await fetchGoals();
    } catch (err) {
      console.error('Failed to create goal', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !newProgressVal) return;

    const val = parseFloat(newProgressVal);
    const completed = val >= selectedGoal.targetValue;

    try {
      await apiFetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          currentValue: val,
          completed,
        }),
      });

      if (completed) {
        triggerCelebration();
      }

      setUpdateModalOpen(false);
      setSelectedGoal(null);
      await fetchGoals();
    } catch (err) {
      console.error('Failed to update goal', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
      await fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetValue('');
    setCurrentValue('');
    setDeadline('');
  };

  const handleTypeSelect = (type: string) => {
    setGoalType(type);
    if (type === 'weight') {
      setUnit(settings?.weightUnit || 'kg');
      setTitle('Reach Target Body Weight');
    } else if (type === 'workout_frequency') {
      setUnit('workouts/week');
      setTitle('Consistency Target');
    } else if (type === 'streak') {
      setUnit('days');
      setTitle('Active Workout Streak');
    } else if (type === 'exercise_weight') {
      setUnit(settings?.weightUnit || 'kg');
      setTitle('Bench Press Benchmark');
    } else {
      setUnit('mins');
      setTitle('Cardio Endurance Target');
    }
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);
  const displayedGoals = tab === 'active' ? activeGoals : completedGoals;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Fitness Goals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Set ambitious targets, monitor your progress, and celebrate every milestone.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            handleTypeSelect('weight');
            setCreateModalOpen(true);
          }}
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Set New Goal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            tab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active Targets ({activeGoals.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            tab === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedGoals.length})
        </button>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : displayedGoals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {tab === 'active' ? 'No active goals' : 'No completed goals yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {tab === 'active'
                ? 'Stay motivated by defining a clear target for weight, strength, or weekly consistency.'
                : 'Keep training consistently to crush your first fitness milestone!'}
            </p>
            {tab === 'active' && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Define First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedGoals.map((g) => {
            const percent = Math.min(100, Math.max(0, Math.round(((g.currentValue || 0) / g.targetValue) * 100)));

            return (
              <Card key={g.id} className="border-slate-200/90 shadow-xs flex flex-col justify-between">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={g.completed ? 'success' : 'primary'}>
                      {g.goalType.replace('_', ' ')}
                    </Badge>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-3">{g.title}</h3>
                  {g.description && <p className="text-xs text-slate-500 mt-0.5">{g.description}</p>}

                  {/* Target & Current Metrics */}
                  <div className="mt-4 flex items-baseline justify-between text-xs">
                    <span className="text-slate-500">
                      Current:{' '}
                      <span className="font-bold text-slate-900">
                        {g.currentValue || 0} {g.unit}
                      </span>
                    </span>
                    <span className="font-semibold text-slate-700">
                      Target: {g.targetValue} {g.unit}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        g.completed ? 'bg-emerald-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>{percent}% Completed</span>
                    {g.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due {formatDate(g.deadline)}
                      </span>
                    )}
                  </div>
                </CardContent>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end">
                  {!g.completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-semibold"
                      onClick={() => {
                        setSelectedGoal(g);
                        setNewProgressVal(String(g.currentValue || 0));
                        setUpdateModalOpen(true);
                      }}
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      Update Progress
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="md"
        title="Set New Fitness Goal"
        description="Define a target to challenge yourself and stay accountable."
      >
        <form onSubmit={handleCreateGoal} className="space-y-4 pt-1">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Goal Category</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'weight', label: 'Body Weight Target' },
                { id: 'workout_frequency', label: 'Workouts Per Week' },
                { id: 'streak', label: 'Workout Streak (Days)' },
                { id: 'exercise_weight', label: 'Exercise 1RM Benchmark' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTypeSelect(item.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    goalType === item.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Goal Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Drop below 75kg"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Target Value (${unit})`}
              type="number"
              step="0.5"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
              placeholder="e.g. 75"
            />
            <Input
              label={`Starting / Current (${unit})`}
              type="number"
              step="0.5"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="e.g. 80"
            />
          </div>

          <Input
            label="Target Date (Optional)"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

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
              Save Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Progress Modal */}
      {selectedGoal && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          maxWidth="sm"
          title="Update Goal Progress"
          description={`Update current progress for: ${selectedGoal.title}`}
        >
          <form onSubmit={handleUpdateProgress} className="space-y-4 pt-2">
            <Input
              label={`Current Value (${selectedGoal.unit})`}
              type="number"
              step="0.5"
              value={newProgressVal}
              onChange={(e) => setNewProgressVal(e.target.value)}
              required
              autoFocus
            />

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
              Target: <span className="font-bold text-slate-800">{selectedGoal.targetValue} {selectedGoal.unit}</span>.
              Reaching or exceeding target will mark this goal complete!
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUpdateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Update
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
