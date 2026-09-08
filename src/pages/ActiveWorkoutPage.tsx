import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { RestTimerModal } from '../components/RestTimerModal.tsx';
import { WorkoutSummaryModal } from '../components/WorkoutSummaryModal.tsx';
import {
  Play,
  Pause,
  Clock,
  Plus,
  Trash2,
  Check,
  Dumbbell,
  Search,
  Sparkles,
  Zap,
  Save,
  AlertCircle,
} from 'lucide-react';
import { formatDuration } from '../lib/utils.ts';
import { Exercise } from '../types.ts';

interface ActiveWorkoutPageProps {
  workoutId: string;
  onNavigate: (view: string, data?: any) => void;
}

export const ActiveWorkoutPage: React.FC<ActiveWorkoutPageProps> = ({ workoutId, onNavigate }) => {
  const { apiFetch, settings } = useAuth();
  const [workout, setWorkout] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Rest Timer State
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(settings?.defaultRestTime || 60);

  // Add Exercise on the fly
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Finish summary state
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  // Load initial workout details
  const fetchWorkout = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/workouts/${workoutId}`);
      setWorkout(data);

      // If workout already had some elapsed duration:
      if (data.durationMinutes) {
        setElapsedSeconds(data.durationMinutes * 60);
      }
    } catch (err) {
      console.error('Failed to load active workout', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkout();
  }, [workoutId]);

  // Load exercise library for "+ Add Exercise"
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const list = await apiFetch('/api/exercises');
        setAllExercises(list);
      } catch (err) {
        console.error('Failed to load library', err);
      }
    };
    loadExercises();
  }, []);

  // Workout stopwatch
  useEffect(() => {
    if (isPaused || !workout || workout.status === 'completed') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, workout]);

  // Handle Set Change (weight, reps, rpe)
  const handleSetChange = (workoutExerciseId: string, setId: string, field: string, value: any) => {
    setWorkout((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((we: any) => {
          if (we.id !== workoutExerciseId) return we;
          return {
            ...we,
            sets: we.sets.map((s: any) => {
              if (s.id !== setId) return s;
              return { ...s, [field]: value };
            }),
          };
        }),
      };
    });
  };

  // Toggle Set Completion
  const handleToggleSet = async (workoutExerciseId: string, setId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Find the target set
    const we = workout.exercises.find((e: any) => e.id === workoutExerciseId);
    const setObj = we?.sets.find((s: any) => s.id === setId);
    if (!setObj) return;

    // Optimistic UI update
    setWorkout((prev: any) => ({
      ...prev,
      exercises: prev.exercises.map((e: any) => {
        if (e.id !== workoutExerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s: any) => {
            if (s.id !== setId) return s;
            return { ...s, completed: newStatus };
          }),
        };
      }),
    }));

    // Start rest timer if newly completed
    if (newStatus) {
      setRestTimerOpen(true);
    }

    // Persist to backend
    try {
      await apiFetch(`/api/workouts/${workoutId}/sets/${setId}`, {
        method: 'PUT',
        body: JSON.stringify({
          weight: parseFloat(setObj.weight) || 0,
          reps: parseInt(setObj.reps) || 0,
          rpe: setObj.rpe ? parseFloat(setObj.rpe) : null,
          completed: newStatus,
        }),
      });
    } catch (err) {
      console.error('Failed to sync set update', err);
    }
  };

  // Add a new set to an exercise
  const handleAddSet = async (workoutExerciseId: string) => {
    const we = workout.exercises.find((e: any) => e.id === workoutExerciseId);
    if (!we) return;

    const nextSetNumber = (we.sets?.length || 0) + 1;
    const lastSet = we.sets?.[we.sets.length - 1];
    const defaultWeight = lastSet ? lastSet.weight : 20;
    const defaultReps = lastSet ? lastSet.reps : 10;

    try {
      const newSet = await apiFetch(`/api/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`, {
        method: 'POST',
        body: JSON.stringify({
          setNumber: nextSetNumber,
          weight: defaultWeight,
          reps: defaultReps,
          completed: false,
        }),
      });

      setWorkout((prev: any) => ({
        ...prev,
        exercises: prev.exercises.map((e: any) => {
          if (e.id !== workoutExerciseId) return e;
          return {
            ...e,
            sets: [...e.sets, newSet],
          };
        }),
      }));
    } catch (err) {
      console.error('Failed to add set', err);
    }
  };

  // Remove a set
  const handleRemoveSet = async (workoutExerciseId: string, setId: string) => {
    try {
      await apiFetch(`/api/workouts/${workoutId}/sets/${setId}`, { method: 'DELETE' });
      setWorkout((prev: any) => ({
        ...prev,
        exercises: prev.exercises.map((e: any) => {
          if (e.id !== workoutExerciseId) return e;
          return {
            ...e,
            sets: e.sets.filter((s: any) => s.id !== setId),
          };
        }),
      }));
    } catch (err) {
      console.error('Failed to delete set', err);
    }
  };

  // Add exercise to active session
  const handleAddExerciseToWorkout = async (exercise: Exercise) => {
    try {
      const added = await apiFetch(`/api/workouts/${workoutId}/exercises`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: exercise.id,
          orderIndex: (workout.exercises?.length || 0) + 1,
        }),
      });

      setWorkout((prev: any) => ({
        ...prev,
        exercises: [...(prev.exercises || []), added],
      }));
      setExercisePickerOpen(false);
    } catch (err) {
      console.error('Failed to add exercise to active workout', err);
    }
  };

  // Remove exercise from active session
  const handleRemoveExercise = async (workoutExerciseId: string) => {
    try {
      await apiFetch(`/api/workouts/${workoutId}/exercises/${workoutExerciseId}`, { method: 'DELETE' });
      setWorkout((prev: any) => ({
        ...prev,
        exercises: prev.exercises.filter((e: any) => e.id !== workoutExerciseId),
      }));
    } catch (err) {
      console.error('Failed to delete workout exercise', err);
    }
  };

  // Finish Workout
  const handleFinishWorkout = async () => {
    setIsFinishing(true);
    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));

    try {
      const res = await apiFetch(`/api/workouts/${workoutId}/finish`, {
        method: 'POST',
        body: JSON.stringify({
          durationMinutes: durationMins,
        }),
      });

      setSummaryData({
        ...res,
        durationMinutes: durationMins,
        workoutName: workout.name,
      });
    } catch (err) {
      console.error('Failed to finish workout', err);
    } finally {
      setIsFinishing(false);
    }
  };

  // Discard Workout
  const handleDiscard = async () => {
    try {
      await apiFetch(`/api/workouts/${workoutId}`, { method: 'DELETE' });
      onNavigate('workouts');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !workout) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-72" />
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="h-40 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  // Estimated calories burned
  const estCalories = Math.round((elapsedSeconds / 60) * 6.5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-28 md:pb-16">
      {/* Top Session Sticky Bar */}
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-md sticky top-18 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {workout.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono font-bold text-slate-800">
                  {formatDuration(elapsedSeconds)}
                </span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{estCalories} kcal</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stopwatch & Action controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 mr-1 text-emerald-600 fill-current" /> : <Pause className="w-3.5 h-3.5 mr-1" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setDiscardModalOpen(true)}
            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Discard
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleFinishWorkout}
            isLoading={isFinishing}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Finish Workout
          </Button>
        </div>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-4">
        {workout.exercises?.map((we: any, exIdx: number) => (
          <Card key={we.id} className="border-slate-200/90 shadow-xs">
            <CardContent className="p-5 space-y-3">
              {/* Exercise Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                    {exIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{we.name}</h3>
                    <p className="text-[11px] text-slate-500">{we.muscleGroup} • {we.equipment}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveExercise(we.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  title="Remove exercise from workout"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                      <th className="py-2 text-left w-12">Set</th>
                      <th className="py-2 text-left w-28">Weight (kg)</th>
                      <th className="py-2 text-left w-24">Reps</th>
                      <th className="py-2 text-left w-20">RPE</th>
                      <th className="py-2 text-center w-16">Done</th>
                      <th className="py-2 text-right w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {we.sets?.map((set: any) => (
                      <tr
                        key={set.id}
                        className={`transition-colors ${
                          set.completed ? 'bg-emerald-50/40 text-emerald-950 font-medium' : ''
                        }`}
                      >
                        <td className="py-2 font-bold text-slate-700">{set.setNumber}</td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weight}
                            onChange={(e) => handleSetChange(we.id, set.id, 'weight', e.target.value)}
                            onBlur={() => handleSetChange(we.id, set.id, 'weight', parseFloat(set.weight) || 0)}
                            className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => handleSetChange(we.id, set.id, 'reps', e.target.value)}
                            onBlur={() => handleSetChange(we.id, set.id, 'reps', parseInt(set.reps) || 0)}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.5"
                            placeholder="Optional"
                            value={set.rpe || ''}
                            onChange={(e) => handleSetChange(we.id, set.id, 'rpe', e.target.value)}
                            className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSet(we.id, set.id, set.completed)}
                            className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${
                              set.completed
                                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(we.id, set.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Set Button */}
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddSet(we.id)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Set
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Exercise on the Fly */}
      <div className="text-center pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => setExercisePickerOpen(true)}
          className="border-dashed border-2 py-4 w-full text-slate-600 hover:text-emerald-700 hover:border-emerald-400"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Exercise to Current Session
        </Button>
      </div>

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={restTimerOpen}
        initialSeconds={restSeconds}
        onClose={() => setRestTimerOpen(false)}
        onFinish={() => setRestTimerOpen(false)}
      />

      {/* Workout Summary Celebration Modal */}
      {summaryData && (
        <WorkoutSummaryModal
          isOpen={true}
          onClose={() => {
            setSummaryData(null);
            onNavigate('dashboard');
          }}
          workoutName={summaryData.workoutName}
          durationMinutes={summaryData.durationMinutes}
          exerciseCount={workout.exercises?.length || 0}
          setCount={
            workout.exercises?.reduce(
              (acc: number, ex: any) => acc + (ex.sets?.filter((s: any) => s.completed).length || 0),
              0
            ) || 0
          }
          totalVolume={summaryData.totalVolume || 0}
          caloriesBurned={summaryData.caloriesBurned || 0}
          streakDays={summaryData.streakDays || 1}
          achievementsUnlocked={summaryData.achievementsUnlocked || []}
          weightUnit={settings?.weightUnit || 'kg'}
          onNavigate={onNavigate}
        />
      )}

      {/* Discard Confirmation Modal */}
      {discardModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setDiscardModalOpen(false)}
          maxWidth="sm"
          title="Discard Workout"
          description="Are you sure you want to discard this workout? All sets and logged duration will be lost."
        >
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setDiscardModalOpen(false)}>
              Keep Working Out
            </Button>
            <Button variant="danger" size="sm" onClick={handleDiscard}>
              Discard Workout
            </Button>
          </div>
        </Modal>
      )}

      {/* Exercise Picker Modal for In-Session Additions */}
      <Modal
        isOpen={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        maxWidth="lg"
        title="Add Exercise"
        description="Choose an exercise to add immediately to your active workout"
      >
        <div className="space-y-4 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search exercise..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {allExercises
              .filter((ex) => !exerciseSearch || ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
              .map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => handleAddExerciseToWorkout(ex)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition-all text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{ex.name}</p>
                    <p className="text-slate-500 text-[11px]">{ex.muscleGroup} • {ex.equipment}</p>
                  </div>
                  <Button size="sm" variant="primary" className="h-7 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
