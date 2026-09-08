import React, { useEffect } from 'react';
import { Modal } from './ui/Modal.tsx';
import { Button } from './ui/Button.tsx';
import { Trophy, Flame, Dumbbell, Timer, Zap, CheckCircle2 } from 'lucide-react';
import { triggerCelebration } from '../lib/confetti.ts';
import { Achievement } from '../types.ts';

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  durationMinutes: number;
  exerciseCount: number;
  setCount: number;
  totalVolume: number;
  caloriesBurned: number;
  streakDays: number;
  achievementsUnlocked: Achievement[];
  weightUnit?: string;
  onNavigate: (view: string) => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  isOpen,
  onClose,
  workoutName,
  durationMinutes,
  exerciseCount,
  setCount,
  totalVolume,
  caloriesBurned,
  streakDays,
  achievementsUnlocked,
  weightUnit = 'kg',
  onNavigate,
}) => {
  useEffect(() => {
    if (isOpen) {
      triggerCelebration();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="text-center py-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Workout Complete! 🎉</h2>
        <p className="text-sm text-slate-500 mt-1">Great job finishing <span className="font-semibold text-slate-800">{workoutName}</span></p>

        {/* Streak banner */}
        {streakDays > 0 && (
          <div className="my-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold">
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
            <span>{streakDays} Day Workout Streak Active! Keep the fire burning.</span>
          </div>
        )}

        {/* Unlocked Achievements */}
        {achievementsUnlocked && achievementsUnlocked.length > 0 && (
          <div className="my-3 p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>New Achievement Unlocked!</span>
            </div>
            <div className="space-y-1.5">
              {achievementsUnlocked.map((ach) => (
                <div key={ach.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-200/70 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                    🏆
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-950">{ach.name}</p>
                    <p className="text-[11px] text-amber-800">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workout Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 text-left">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Timer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Duration</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{durationMinutes} min</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-teal-600" />
              <span>Volume</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{totalVolume.toLocaleString()} {weightUnit}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exercises</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{exerciseCount} ({setCount} sets)</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Calories</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{caloriesBurned} kcal</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              onClose();
              onNavigate('progress');
            }}
          >
            View Progress & Trends
          </Button>
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => {
              onClose();
              onNavigate('dashboard');
            }}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </Modal>
  );
};
