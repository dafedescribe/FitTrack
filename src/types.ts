export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  age: number | null;
  height: number | null;
  currentWeight: number | null;
  fitnessLevel: string;
  primaryGoal: string;
  workoutLocation: string;
  preferredWorkoutDuration: string;
  workoutsPerWeek: number;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'miles';
  theme: 'light' | 'dark';
  reminderNotifications: boolean;
  streakNotifications: boolean;
  achievementNotifications: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  goalType: 'weight' | 'workout_frequency' | 'workout_streak' | 'running_distance' | 'strength';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  equipment: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructions: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt?: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  durationSeconds: number;
  distance: number;
  restSeconds: number;
  completed: boolean;
  createdAt?: string;
}

export interface WorkoutExerciseDetail {
  id: string;
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
  notes: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  instructions: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  workoutType: 'strength' | 'cardio' | 'HIIT' | 'running' | 'walking' | 'cycling' | 'yoga' | 'stretching' | 'custom';
  durationMinutes: number;
  caloriesBurned: number;
  notes: string;
  startedAt: string | null;
  completedAt: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  exerciseCount?: number;
  exercises?: WorkoutExerciseDetail[];
}

export interface Measurement {
  id: string;
  userId: string;
  recordedAt: string;
  weight: number | null;
  bodyFatPercentage: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  thighs: number | null;
  createdAt: string;
}

export type BodyMeasurement = Measurement;

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string;
  frequency: string;
  active: boolean;
  createdAt: string;
  logs?: Record<string, boolean>; // date -> completed
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirementType: string;
  requirementValue: number;
  isEarned?: boolean;
  earnedAt?: string | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'streak' | 'goal' | 'achievement' | 'system';
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  workoutsThisWeek: number;
  totalWorkoutMinutes: number;
  currentStreak: number;
  longestStreak: number;
  achievementsEarned: number;
}

export interface DayActivity {
  day: string;
  date: string;
  completed: boolean;
  isToday: boolean;
}

export interface DashboardData {
  profile: Profile;
  primaryGoal: Goal | null;
  stats: DashboardStats;
  weekActivity: DayActivity[];
  todayWorkout: Workout | null;
  recentWorkouts: Workout[];
}
