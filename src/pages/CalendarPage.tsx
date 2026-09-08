import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Clock,
  Zap,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { formatDate } from '../lib/utils.ts';

interface CalendarPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onNavigate }) => {
  const { apiFetch } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/calendar?year=${year}&month=${month + 1}`);
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
  // Convert Sunday=0 to Monday=0 index
  const startDay = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Activity Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visual month-by-month history of every workout and logged achievement.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold text-slate-900 min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty slots before first day */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-28 rounded-xl bg-slate-50/40 border border-transparent" />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayInfo = calendarData.find((d) => d.date === dateStr);
              const isToday = dateStr === todayStr;
              const hasWorkouts = dayInfo && dayInfo.workouts && dayInfo.workouts.length > 0;

              return (
                <div
                  key={dateStr}
                  onClick={() => dayInfo && setSelectedDay(dayInfo)}
                  className={`h-20 sm:h-28 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                    hasWorkouts
                      ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 hover:shadow-xs'
                      : isToday
                      ? 'border-slate-400 bg-slate-50/80 font-bold'
                      : 'border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasWorkouts && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>

                  {/* Badges / summary dots */}
                  <div className="space-y-1">
                    {hasWorkouts && (
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-bold text-emerald-800 truncate">
                          {dayInfo.workouts[0].name}
                        </p>
                        {dayInfo.workouts.length > 1 && (
                          <span className="text-[9px] text-emerald-600 font-semibold">
                            +{dayInfo.workouts.length - 1} more
                          </span>
                        )}
                      </div>
                    )}
                    {dayInfo?.weight && (
                      <div className="hidden sm:flex items-center gap-1 text-[10px] text-indigo-700">
                        <Scale className="w-2.5 h-2.5" />
                        <span>{dayInfo.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Modal */}
      {selectedDay && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDay(null)}
          maxWidth="md"
          title={`Activity for ${formatDate(selectedDay.date)}`}
        >
          <div className="space-y-4 pt-2">
            {selectedDay.workouts?.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Completed Workouts
                </h4>
                {selectedDay.workouts.map((w: any) => (
                  <div key={w.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{w.name}</p>
                          <p className="text-[11px] text-slate-500 capitalize">{w.workoutType}</p>
                        </div>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600 font-medium">
                      {w.durationMinutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {w.durationMinutes} mins
                        </span>
                      )}
                      {w.caloriesBurned > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          {w.caloriesBurned} kcal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No workout recorded on this date.</p>
            )}

            {selectedDay.weight && (
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-900">Recorded Body Weight</span>
                <span className="font-bold text-indigo-950">{selectedDay.weight} kg</span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedDay(null);
                  onNavigate('new-workout');
                }}
              >
                Log Workout For Today
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
