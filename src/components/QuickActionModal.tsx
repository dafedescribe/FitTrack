import React from 'react';
import { Modal } from './ui/Modal.tsx';
import { Play, PlusCircle, Scale, CheckSquare, Target } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenRecordWeight: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenRecordWeight,
}) => {
  const actions = [
    {
      title: 'Start Live Workout',
      desc: 'Launch active workout tracker with timers & set logging',
      icon: Play,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100/70',
      action: () => {
        onNavigate('workouts');
        onClose();
      },
    },
    {
      title: 'Create Custom Workout',
      desc: 'Build a new workout routine from the exercise library',
      icon: PlusCircle,
      color: 'bg-teal-50 text-teal-700 border-teal-200/60 hover:bg-teal-100/70',
      action: () => {
        onNavigate('new-workout');
        onClose();
      },
    },
    {
      title: 'Log Weight & Measurements',
      desc: 'Record body weight, body fat %, and circumferences',
      icon: Scale,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 hover:bg-indigo-100/70',
      action: () => {
        onClose();
        onOpenRecordWeight();
      },
    },
    {
      title: 'Check Daily Habits',
      desc: 'Review and check off today’s wellness habits',
      icon: CheckSquare,
      color: 'bg-amber-50 text-amber-700 border-amber-200/60 hover:bg-amber-100/70',
      action: () => {
        onNavigate('habits');
        onClose();
      },
    },
    {
      title: 'Set a Fitness Goal',
      desc: 'Define a target for weight, workout frequency, or strength',
      icon: Target,
      color: 'bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-100/70',
      action: () => {
        onNavigate('goals');
        onClose();
      },
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Actions" description="What would you like to do right now?">
      <div className="space-y-2.5 pt-2">
        {actions.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.action}
              className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all ${item.color}`}
            >
              <div className="p-2 rounded-xl bg-white shadow-xs">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
