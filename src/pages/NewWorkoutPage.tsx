import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Dumbbell,
  Play,
  Save,
  Search,
  Check,
  Sparkles,
} from 'lucide-react';
import { Exercise } from '../types.ts';

interface NewWorkoutPageProps {
  onNavigate: (view: string, data?: any) => void;
  onStartWorkout: (workout: any) => void;
}

export const NewWorkoutPage: React.FC<NewWorkoutPageProps> = ({ onNavigate, onStartWorkout }) => {
  const { apiFetch } = useAuth();
  const [name, setName] = useState('');
  const [workoutType, setWorkoutType] = useState('strength');
  const [notes, setNotes] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const workoutTypes = [
    { id: 'strength', label: 'Strength' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'HIIT', label: 'HIIT' },
    { id: 'running', label: 'Running' },
    { id: 'walking', label: 'Walking' },
    { id: 'cycling', label: 'Cycling' },
    { id: 'yoga', label: 'Yoga' },
    { id: 'stretching', label: 'Stretching' },
    { id: 'custom', label: 'Custom' },
  ];

  const muscleGroups = ['all', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Full body'];

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const list = await apiFetch('/api/exercises');
        setAllExercises(list);
      } catch (err) {
        console.error('Failed to load exercises:', err);
      }
    };
    loadExercises();
  }, []);

  const handleToggleExercise = (exercise: Exercise) => {
    if (selectedExercises.some((e) => e.id === exercise.id)) {
      setSelectedExercises((prev) => prev.filter((e) => e.id !== exercise.id));
    } else {
      setSelectedExercises((prev) => [...prev, exercise]);
    }
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSubmit = async (startImmediately: boolean) => {
    if (!name.trim()) {
      setError('Please provide a name for this workout.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const created = await apiFetch('/api/workouts', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          workoutType,
          notes,
          status: startImmediately ? 'in_progress' : 'planned',
          exerciseIds: selectedExercises.map((e) => e.id),
        }),
      });

      if (startImmediately) {
        onStartWorkout(created);
      } else {
        onNavigate('workouts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create workout');
    } finally {
      setLoading(false);
    }
  };

  const filteredLibrary = allExercises.filter((ex) => {
    if (muscleFilter !== 'all' && ex.muscleGroup !== muscleFilter) return false;
    if (exerciseSearch && !ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('workouts')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Workout Routine</h1>
          <p className="text-xs text-slate-500">Assemble exercises, customize targets, and schedule or launch.</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Routine Configuration */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <Input
            label="Workout Name"
            placeholder="e.g. Upper Body Hypertrophy, Leg Day Power, Core Crusher"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Workout Category</label>
            <div className="flex flex-wrap gap-2">
              {workoutTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setWorkoutType(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    workoutType === t.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Notes / Instructions (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Focus on 2-second eccentric phase. Keep rest strictly under 60 seconds."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercises Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Exercises ({selectedExercises.length})
              </h3>
              <p className="text-xs text-slate-500">Selected movements for this routine</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExercisePickerOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Exercises
            </Button>
          </div>

          {selectedExercises.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Dumbbell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">No exercises added yet.</p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => setExercisePickerOpen(true)}
              >
                Browse 30+ Exercises
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedExercises.map((ex, index) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{ex.name}</p>
                      <p className="text-[11px] text-slate-500">{ex.muscleGroup} • {ex.equipment}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(ex.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          isLoading={loading}
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-1.5" />
          Save as Planned Routine
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => handleSubmit(true)}
          isLoading={loading}
          className="w-full sm:w-auto shadow-sm"
        >
          <Play className="w-4 h-4 fill-current mr-1.5" />
          Start Session Immediately
        </Button>
      </div>

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        maxWidth="lg"
        title="Add Exercises"
        description="Select movements to add to this workout"
      >
        <div className="space-y-4 pt-1">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search exercise by name..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Muscle Group Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {muscleGroups.map((mg) => (
              <button
                key={mg}
                type="button"
                onClick={() => setMuscleFilter(mg)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap capitalize transition-colors ${
                  muscleFilter === mg
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mg}
              </button>
            ))}
          </div>

          {/* Exercises List */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredLibrary.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No exercises match your filter.</p>
            ) : (
              filteredLibrary.map((ex) => {
                const isSelected = selectedExercises.some((e) => e.id === ex.id);
                return (
                  <div
                    key={ex.id}
                    onClick={() => handleToggleExercise(ex)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70'
                        : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{ex.name}</p>
                      <p className="text-slate-500 text-[11px]">{ex.muscleGroup} • {ex.equipment} • {ex.difficulty}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">
              {selectedExercises.length} exercise{selectedExercises.length === 1 ? '' : 's'} selected
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setExercisePickerOpen(false)}
            >
              Done Selecting
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
