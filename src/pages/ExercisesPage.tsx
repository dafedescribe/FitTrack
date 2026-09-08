import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Input } from '../components/ui/Input.tsx';
import {
  Dumbbell,
  Search,
  Plus,
  Filter,
  Info,
  ChevronRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Exercise } from '../types.ts';

interface ExercisesPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const ExercisesPage: React.FC<ExercisesPageProps> = ({ onNavigate }) => {
  const { apiFetch } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Detail Modal
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Custom Exercise Creation Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState('Chest');
  const [customEquipment, setCustomEquipment] = useState('Barbell');
  const [customDifficulty, setCustomDifficulty] = useState('Intermediate');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customTips, setCustomTips] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);

  const muscleGroups = ['all', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Full body'];
  const equipmentList = ['all', 'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Band'];
  const difficultyList = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const list = await apiFetch('/api/exercises');
      setExercises(list);
    } catch (err) {
      console.error('Failed to load exercises', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setSavingCustom(true);
    try {
      const created = await apiFetch('/api/exercises', {
        method: 'POST',
        body: JSON.stringify({
          name: customName.trim(),
          muscleGroup: customMuscle,
          equipment: customEquipment,
          difficulty: customDifficulty,
          instructions: customInstructions ? [customInstructions] : ['Perform with controlled tempo and strict form.'],
          tips: customTips ? [customTips] : ['Maintain core engagement throughout.'],
        }),
      });

      setExercises((prev) => [created, ...prev]);
      setCreateModalOpen(false);
      setCustomName('');
      setCustomInstructions('');
      setCustomTips('');
    } catch (err) {
      console.error('Failed to create custom exercise', err);
    } finally {
      setSavingCustom(false);
    }
  };

  const filtered = exercises.filter((ex) => {
    if (selectedMuscle !== 'all' && ex.muscleGroup.toLowerCase() !== selectedMuscle.toLowerCase()) return false;
    if (selectedEquipment !== 'all' && !ex.equipment.toLowerCase().includes(selectedEquipment.toLowerCase())) return false;
    if (selectedDifficulty !== 'all' && ex.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Exercise Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse movement guides, muscle targets, and technique tips or add custom exercises.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Custom Exercise
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search 30+ exercises by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {/* Muscle Group Pills */}
          <div className="flex-1 overflow-x-auto pb-1 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 shrink-0">Muscle:</span>
            {muscleGroups.map((mg) => (
              <button
                key={mg}
                onClick={() => setSelectedMuscle(mg)}
                className={`px-3 py-1 rounded-lg text-xs capitalize whitespace-nowrap transition-colors ${
                  selectedMuscle === mg
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mg}
              </button>
            ))}
          </div>

          {/* Equipment Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Equipment:</span>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {equipmentList.map((eq) => (
                <option key={eq} value={eq} className="capitalize">
                  {eq === 'all' ? 'All Equipment' : eq}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exercises Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Dumbbell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No exercises found</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or muscle group filters.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('');
                setSelectedMuscle('all');
                setSelectedEquipment('all');
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ex) => (
            <Card
              key={ex.id}
              className="hover:shadow-md transition-all cursor-pointer border-slate-200/90 hover:border-emerald-300 group"
              onClick={() => setSelectedExercise(ex)}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {ex.muscleGroup}
                    </span>
                    <Badge
                      variant={
                        ex.difficulty === 'Beginner'
                          ? 'success'
                          : ex.difficulty === 'Intermediate'
                          ? 'primary'
                          : 'warning'
                      }
                    >
                      {ex.difficulty}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mt-2.5">
                    {ex.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ex.equipment}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>View Technique & Form</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedExercise(null)}
          maxWidth="lg"
          title={
            <div className="flex items-center gap-2">
              <span>{selectedExercise.name}</span>
              {selectedExercise.isCustom && (
                <Badge variant="secondary">Custom</Badge>
              )}
            </div>
          }
          description={`${selectedExercise.muscleGroup} • ${selectedExercise.equipment} • ${selectedExercise.difficulty} Level`}
        >
          <div className="space-y-4 pt-2">
            {/* Target Breakdown */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400">Primary Target</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedExercise.muscleGroup}</p>
              </div>
              <div>
                <span className="text-slate-400">Equipment</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedExercise.equipment}</p>
              </div>
              <div>
                <span className="text-slate-400">Difficulty</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedExercise.difficulty}</p>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Step-by-Step Technique
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 pl-1 leading-relaxed">
                {selectedExercise.instructions?.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ol>
            </div>

            {/* Coach Tips */}
            {selectedExercise.tips && selectedExercise.tips.length > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Coach Cue
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-emerald-800">
                  {selectedExercise.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedExercise(null);
                  onNavigate('new-workout');
                }}
              >
                Add to New Workout
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Custom Exercise Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="md"
        title="Add Custom Exercise"
        description="Create your own movement and save it to your personal exercise library."
      >
        <form onSubmit={handleCreateCustom} className="space-y-4 pt-1">
          <Input
            label="Exercise Name"
            placeholder="e.g. Incline Landmine Press"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Muscle Group</label>
              <select
                value={customMuscle}
                onChange={(e) => setCustomMuscle(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
              >
                {muscleGroups.filter((m) => m !== 'all').map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment</label>
              <select
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
              >
                {equipmentList.filter((e) => e !== 'all').map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
            <select
              value={customDifficulty}
              onChange={(e) => setCustomDifficulty(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500"
            >
              {difficultyList.filter((d) => d !== 'all').map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Steps (Optional)</label>
            <textarea
              rows={2}
              placeholder="Describe posture, grip, and motion path..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pro Tip / Cue (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Squeeze lats at bottom of movement"
              value={customTips}
              onChange={(e) => setCustomTips(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
            />
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
              isLoading={savingCustom}
            >
              Save Exercise
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
