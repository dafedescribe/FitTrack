import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';
import {
  Target,
  Activity,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  Flame,
} from 'lucide-react';
import { triggerCelebration } from '../lib/confetti.ts';

interface OnboardingPageProps {
  onNavigate: (view: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { apiFetch, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [primaryGoal, setPrimaryGoal] = useState('Build muscle');
  const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(4);
  const [workoutLocation, setWorkoutLocation] = useState('Gym');
  const [preferredDuration, setPreferredDuration] = useState('45–60 minutes');
  const [currentWeight, setCurrentWeight] = useState('75');
  const [height, setHeight] = useState('178');

  const goals = [
    { id: 'Lose weight', title: 'Lose Weight', desc: 'Burn fat and improve metabolic health' },
    { id: 'Build muscle', title: 'Build Muscle', desc: 'Gain hypertrophy and muscular definition' },
    { id: 'Get stronger', title: 'Get Stronger', desc: 'Increase raw strength on compound lifts' },
    { id: 'Improve fitness', title: 'Improve General Fitness', desc: 'Boost stamina, energy, and mobility' },
    { id: 'Improve endurance', title: 'Improve Endurance', desc: 'Cardiovascular training and aerobic capacity' },
    { id: 'Maintain fitness', title: 'Maintain Current Fitness', desc: 'Consistency, balance, and injury prevention' },
  ];

  const fitnessLevels = [
    { id: 'Beginner', title: 'Beginner', desc: 'New to consistent exercise or returning after a long break' },
    { id: 'Intermediate', title: 'Intermediate', desc: 'Training regularly for 6+ months with good form' },
    { id: 'Advanced', title: 'Advanced', desc: 'Multiple years of dedicated resistance or sports training' },
  ];

  const locations = [
    { id: 'Gym', title: 'Commercial Gym', desc: 'Access to barbells, dumbbells, and cable machines' },
    { id: 'Home', title: 'Home Gym / Calisthenics', desc: 'Dumbbells, resistance bands, or bodyweight' },
    { id: 'Outdoors', title: 'Outdoors', desc: 'Running tracks, parks, and outdoor fitness spots' },
    { id: 'Mixed', title: 'Mixed Routine', desc: 'Combines gym sessions with home or outdoor workouts' },
  ];

  const durations = [
    { id: '15–30 minutes', title: '15–30 minutes', desc: 'Quick, high-efficiency interval workouts' },
    { id: '30–45 minutes', title: '30–45 minutes', desc: 'Balanced standard sessions' },
    { id: '45–60 minutes', title: '45–60 minutes', desc: 'Comprehensive strength & cardio workouts' },
    { id: '60+ minutes', title: '60+ minutes', desc: 'In-depth powerlifting or endurance training' },
  ];

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Update Profile
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          primaryGoal,
          fitnessLevel,
          workoutsPerWeek,
          workoutLocation,
          preferredWorkoutDuration: preferredDuration,
          currentWeight: currentWeight ? parseFloat(currentWeight) : null,
          height: height ? parseFloat(height) : null,
          onboardingCompleted: true,
        }),
      });

      // 2. Automatically generate an initial Goal matching their primary choice
      let goalTitle = `${primaryGoal}`;
      let targetVal = 4;
      let unit = 'workouts/week';
      let gType: any = 'workout_frequency';

      if (primaryGoal === 'Lose weight') {
        gType = 'weight';
        unit = 'kg';
        targetVal = currentWeight ? Math.max(40, parseFloat(currentWeight) - 5) : 70;
        goalTitle = `Reach ${targetVal} kg Target`;
      } else if (primaryGoal === 'Build muscle' || primaryGoal === 'Get stronger') {
        gType = 'workout_frequency';
        unit = 'workouts/week';
        targetVal = workoutsPerWeek;
        goalTitle = `Complete ${workoutsPerWeek} Workouts Every Week`;
      }

      await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          goalType: gType,
          title: goalTitle,
          description: `Primary focus configured during setup.`,
          targetValue: targetVal,
          currentValue: gType === 'weight' ? parseFloat(currentWeight) || 0 : 0,
          unit,
        }),
      });

      await refreshProfile();
      triggerCelebration();
      onNavigate('dashboard');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Step Indicator Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
            <Flame className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span>Personalizing FitTrack</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Step {step} of {totalSteps}
          </h2>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-xl border-slate-200/90">
          <CardContent className="p-6 sm:p-8">
            {/* STEP 1: PRIMARY GOAL */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">What is your primary fitness goal?</h3>
                  <p className="text-sm text-slate-500 mt-1">We will tailor your workouts and progress milestones accordingly.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goals.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setPrimaryGoal(g.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        primaryGoal === g.id
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900">{g.title}</span>
                        {primaryGoal === g.id && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: FITNESS LEVEL */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">What is your current fitness level?</h3>
                  <p className="text-sm text-slate-500 mt-1">This helps suggest appropriate volume and exercise weights.</p>
                </div>

                <div className="space-y-3">
                  {fitnessLevels.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setFitnessLevel(lvl.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${
                        fitnessLevel === lvl.id
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base text-slate-900">{lvl.title}</span>
                        {fitnessLevel === lvl.id && <Check className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: WORKOUTS PER WEEK */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">How many days a week will you train?</h3>
                  <p className="text-sm text-slate-500 mt-1">Consistency matters more than perfection.</p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setWorkoutsPerWeek(days)}
                      className={`h-20 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                        workoutsPerWeek === days
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <span className="text-2xl font-black">{days}</span>
                      <span className="text-[10px] uppercase font-semibold">Days</span>
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
                  💡 Training <span className="font-semibold text-slate-900">{workoutsPerWeek} days per week</span> provides optimal recovery time for your muscular and nervous systems.
                </div>
              </div>
            )}

            {/* STEP 4: WORKOUT LOCATION */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Where do you typically work out?</h3>
                  <p className="text-sm text-slate-500 mt-1">Select your primary training environment.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setWorkoutLocation(loc.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        workoutLocation === loc.id
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900">{loc.title}</span>
                        {workoutLocation === loc.id && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{loc.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: DURATION & BODY STATS */}
            {step === 5 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Duration & Body Measurements</h3>
                  <p className="text-sm text-slate-500 mt-1">Almost ready! Tell us your session length and current body stats.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Preferred Session Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {durations.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setPreferredDuration(d.id)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                          preferredDuration === d.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        {d.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Input
                    label="Current Weight (kg)"
                    type="number"
                    step="0.1"
                    placeholder="75"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                  />
                  <Input
                    label="Height (cm)"
                    type="number"
                    placeholder="178"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(step + 1)}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleFinish}
                  isLoading={loading}
                >
                  Complete Setup
                  <Check className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
