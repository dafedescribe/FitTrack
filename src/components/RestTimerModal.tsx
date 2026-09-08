import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button.tsx';
import { Clock, Plus, Minus, X } from 'lucide-react';
import { formatDuration } from '../lib/utils.ts';

interface RestTimerProps {
  isOpen: boolean;
  initialSeconds?: number;
  onClose: () => void;
  onFinish?: () => void;
}

export const RestTimerModal: React.FC<RestTimerProps> = ({
  isOpen,
  initialSeconds = 60,
  onClose,
  onFinish,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(initialSeconds);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onFinish) onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeLeft, onFinish]);

  if (!isOpen) return null;

  const progress = Math.max(0, Math.min(100, (timeLeft / initialSeconds) * 100));

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 w-72 border border-slate-700/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Rest Timer</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big countdown */}
        <div className="text-center py-2">
          <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
            {formatDuration(timeLeft)}
          </span>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Time adjustment controls */}
        <div className="flex items-center justify-between gap-1.5 pt-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setTimeLeft((prev) => Math.max(0, prev - 15))}
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 flex-1 text-xs"
          >
            <Minus className="w-3 h-3 mr-1" />
            15s
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setTimeLeft((prev) => prev + 30)}
            className="bg-slate-800 text-slate-200 hover:bg-slate-700 flex-1 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            30s
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onClose}
            className="flex-1 text-xs bg-emerald-500 hover:bg-emerald-600"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};
