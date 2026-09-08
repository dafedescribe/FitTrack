import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import {
  Dumbbell,
  Plus,
  Play,
  Copy,
  Trash2,
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
} from 'lucide-react';
import { Workout } from '../types.ts';
import { formatDate } from '../lib/utils.ts';

interface WorkoutsPageProps {
  onNavigate: (view: string, data?: any) => void;
  onStartWorkout: (workout: Workout) => void;
  initialSelectedId?: string;
}

export const WorkoutsPage: React.FC<WorkoutsPageProps> = ({
  onNavigate,
  onStartWorkout,
  initialSelectedId,
}) => {
  const { apiFetch } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const list = await apiFetch('/api/workouts');
      setWorkouts(list);

      if (initialSelectedId) {
        loadWorkoutDetails(initialSelectedId);
      }
    } catch (err) {
      console.error('Failed to load workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [initialSelectedId]);

  const loadWorkoutDetails = async (id: string) => {
    try {
      const details = await apiFetch(`/api/workouts/${id}`);
      setSelectedWorkout(details);
      setDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to load workout details:', err);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      const duplicated = await apiFetch(`/api/workouts/${id}/duplicate`, { method: 'POST' });
      await fetchWorkouts();
      loadWorkoutDetails(duplicated.id);
    } catch (err) {
      console.error('Failed to duplicate workout:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await apiFetch(`/api/workouts/${id}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      setDetailModalOpen(false);
      await fetchWorkouts();
    } catch (err) {
      console.error('Failed to delete workout:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWorkouts = workouts.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.workoutType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Workouts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build routines, launch active sessions, and review your training history.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => onNavigate('new-workout')}
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Workout
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'planned', label: 'Planned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search workouts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Workout Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Dumbbell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No workouts found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first workout plan or launch an instant workout session.'}
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => onNavigate('new-workout')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Build Workout Routine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkouts.map((w) => (
            <Card
              key={w.id}
              className="hover:shadow-md transition-all cursor-pointer border-slate-200/90 flex flex-col justify-between"
              onClick={() => loadWorkoutDetails(w.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
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
                  <span className="text-[11px] text-slate-400">
                    {formatDate(w.completedAt || w.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                  {w.name}
                </h3>

                <p className="text-xs text-slate-500 mt-1 capitalize">
                  {w.workoutType} • {w.exerciseCount || 0} exercises
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                  {w.durationMinutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {w.durationMinutes} min
                    </span>
                  )}
                  {w.caloriesBurned > 0 && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {w.caloriesBurned} kcal
                    </span>
                  )}
                </div>
              </CardContent>

              <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDuplicate(w.id, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                    title="Duplicate Workout"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(w.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                    title="Delete Workout"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {w.status === 'completed' ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    className="h-8 text-xs font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartWorkout(w);
                    }}
                  >
                    <Play className="w-3 h-3 fill-current mr-1" />
                    {w.status === 'in_progress' ? 'Resume' : 'Start'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          maxWidth="xl"
          title={
            <div className="flex items-center gap-2.5">
              <span>{selectedWorkout.name}</span>
              <Badge
                variant={
                  selectedWorkout.status === 'completed'
                    ? 'success'
                    : selectedWorkout.status === 'in_progress'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {selectedWorkout.status}
              </Badge>
            </div>
          }
          description={`Created ${formatDate(selectedWorkout.createdAt)} • ${selectedWorkout.workoutType} routine`}
        >
          <div className="space-y-5 pt-2">
            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500">Duration</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedWorkout.durationMinutes || 0} min
                </p>
              </div>
              <div>
                <span className="text-slate-500">Calories</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedWorkout.caloriesBurned || 0} kcal
                </p>
              </div>
              <div>
                <span className="text-slate-500">Exercises</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedWorkout.exercises?.length || 0}
                </p>
              </div>
            </div>

            {selectedWorkout.notes && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-900">
                <span className="font-semibold">Notes:</span> {selectedWorkout.notes}
              </div>
            )}

            {/* Exercises & Sets Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Exercises & Sets</h4>
              <div className="space-y-3">
                {selectedWorkout.exercises?.map((we: any, idx: number) => (
                  <div key={we.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">
                        {idx + 1}. {we.name}
                      </span>
                      <span className="text-[11px] text-slate-500">{we.muscleGroup} • {we.equipment}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <th className="py-1">Set</th>
                            <th className="py-1">Weight</th>
                            <th className="py-1">Reps</th>
                            <th className="py-1 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {we.sets?.map((s: any) => (
                            <tr key={s.id} className="text-slate-700">
                              <td className="py-1 font-semibold">{s.setNumber}</td>
                              <td className="py-1">{s.weight} kg</td>
                              <td className="py-1">{s.reps} reps</td>
                              <td className="py-1 text-right">
                                {s.completed ? (
                                  <span className="text-emerald-600 font-medium">Completed</span>
                                ) : (
                                  <span className="text-slate-400">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(selectedWorkout.id)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleDuplicate(selectedWorkout.id, e)}
                  isLoading={actionLoading}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Duplicate
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    onStartWorkout(selectedWorkout);
                  }}
                >
                  <Play className="w-3.5 h-3.5 fill-current mr-1" />
                  {selectedWorkout.status === 'in_progress' ? 'Resume Workout' : 'Start Workout'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          maxWidth="sm"
          title="Delete Workout"
          description="Are you sure you want to delete this workout? This action cannot be undone."
        >
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(deleteConfirmId)}
              isLoading={actionLoading}
            >
              Delete Workout
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
