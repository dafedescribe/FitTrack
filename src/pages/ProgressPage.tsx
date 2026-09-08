import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import {
  TrendingUp,
  Scale,
  Dumbbell,
  Calendar,
  Clock,
  Plus,
  Trophy,
  Award,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatDate } from '../lib/utils.ts';
import { BodyMeasurement } from '../types.ts';

interface ProgressPageProps {
  onNavigate: (view: string, data?: any) => void;
  onOpenRecordWeight: () => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ onNavigate, onOpenRecordWeight }) => {
  const { apiFetch, settings, profile } = useAuth();
  const [timeframe, setTimeframe] = useState<'30' | '90' | '180' | '365'>('30');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [strengthData, setStrengthData] = useState<any[]>([]);

  const weightUnit = settings?.weightUnit || 'kg';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analytics, meas, exList] = await Promise.all([
        apiFetch(`/api/analytics?timeframe=${timeframe}`),
        apiFetch('/api/measurements'),
        apiFetch('/api/exercises'),
      ]);

      setAnalyticsData(analytics);
      setMeasurements(meas);
      setExercises(exList);

      if (exList.length > 0 && !selectedExerciseId) {
        // Default to Bench Press or first compound
        const defaultEx = exList.find((e: any) => e.name.toLowerCase().includes('bench')) || exList[0];
        setSelectedExerciseId(defaultEx.id);
        fetchStrengthHistory(defaultEx.id);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStrengthHistory = async (exerciseId: string) => {
    try {
      const hist = await apiFetch(`/api/analytics/strength?exerciseId=${exerciseId}`);
      setStrengthData(hist);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const handleExerciseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedExerciseId(id);
    fetchStrengthHistory(id);
  };

  // Format charts data
  const weightChartData = analyticsData?.weightHistory?.map((m: any) => ({
    date: formatDate(m.recordedAt),
    weight: m.weight,
    bodyFat: m.bodyFatPercentage,
  })) || [];

  const workoutFrequencyData = analyticsData?.workoutFrequency || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analytics & Progress
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visual graphs for weight trends, strength gains, and training frequency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[
              { id: '30', label: '30D' },
              { id: '90', label: '90D' },
              { id: '180', label: '6M' },
              { id: '365', label: '1Y' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  timeframe === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={onOpenRecordWeight}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Log Measurement
          </Button>
        </div>
      </div>

      {/* High-level Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Weight</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {profile?.currentWeight ? `${profile.currentWeight} ${weightUnit}` : '—'}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              {profile?.targetWeight ? `Target: ${profile.targetWeight} ${weightUnit}` : 'Track regularly'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Workouts</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {analyticsData?.summary?.totalWorkouts || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Logged in timeframe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Volume</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {(analyticsData?.summary?.totalVolume || 0).toLocaleString()}
              <span className="text-sm font-normal text-slate-400 ml-1">{weightUnit}</span>
            </p>
            <p className="text-xs text-teal-600 font-semibold mt-1">Moved in training</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Duration</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {analyticsData?.summary?.avgDurationMinutes || 0}
              <span className="text-sm font-normal text-slate-400 ml-1">min</span>
            </p>
            <p className="text-xs text-indigo-600 font-semibold mt-1">Per training session</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart 1: Weight History Progression */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                Body Weight Trends
              </h3>
              <p className="text-xs text-slate-500">Track changes in body mass over time</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenRecordWeight}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Weight Point
            </Button>
          </div>

          {weightChartData.length < 2 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Scale className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Log at least 2 weight points to see your trendline.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={onOpenRecordWeight}
              >
                Log Now
              </Button>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    unit={` ${weightUnit}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name={`Weight (${weightUnit})`}
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10B981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Workout Frequency & Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Workout Frequency (Weekly)
              </h3>
              <p className="text-xs text-slate-500">Sessions completed per week</p>
            </div>

            <div className="h-64 w-full">
              {workoutFrequencyData.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No workout data available for this timeframe.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workoutFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="workouts" name="Workouts" fill="#0D9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Strength Progression (1RM / Estimated Max) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Estimated 1RM Strength
                </h3>
                <p className="text-xs text-slate-500">Calculated via Brzycki / Epley formula</p>
              </div>

              {/* Exercise Selector Dropdown */}
              <select
                value={selectedExerciseId}
                onChange={handleExerciseChange}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[180px]"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-64 w-full">
              {strengthData.length < 1 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <Dumbbell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No logged sets found for this exercise yet.</p>
                  <p className="mt-1">Log a workout with this exercise to track your strength curve.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={strengthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit={` ${weightUnit}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="oneRepMax"
                      name={`1RM (${weightUnit})`}
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#F59E0B' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Body Measurements Log History Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Body Measurements History</h3>
              <p className="text-xs text-slate-500">Full log of your recorded scale and tape measurements</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenRecordWeight}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Entry
            </Button>
          </div>

          {measurements.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No measurements recorded yet. Click "Log Measurement" above to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Weight ({weightUnit})</th>
                    <th className="py-2.5">Body Fat %</th>
                    <th className="py-2.5">Chest</th>
                    <th className="py-2.5">Waist</th>
                    <th className="py-2.5">Hips</th>
                    <th className="py-2.5">Arms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {measurements.slice(0, 10).map((m) => (
                    <tr key={m.id} className="text-slate-700 hover:bg-slate-50">
                      <td className="py-2.5 font-semibold text-slate-900">
                        {formatDate(m.recordedAt)}
                      </td>
                      <td className="py-2.5 font-bold text-emerald-700">
                        {m.weight} {weightUnit}
                      </td>
                      <td className="py-2.5">
                        {m.bodyFatPercentage ? `${m.bodyFatPercentage}%` : '—'}
                      </td>
                      <td className="py-2.5">{m.chest ? `${m.chest} cm` : '—'}</td>
                      <td className="py-2.5">{m.waist ? `${m.waist} cm` : '—'}</td>
                      <td className="py-2.5">{m.hips ? `${m.hips} cm` : '—'}</td>
                      <td className="py-2.5">{m.arms ? `${m.arms} cm` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
