import { pgTable, text, integer, doublePrecision, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Profiles table - matches user UID from Firebase Auth
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Firebase Auth UID
  email: text('email').notNull(),
  firstName: text('first_name').default(''),
  lastName: text('last_name').default(''),
  avatarUrl: text('avatar_url').default(''),
  age: integer('age'),
  height: doublePrecision('height'),
  currentWeight: doublePrecision('current_weight'),
  fitnessLevel: text('fitness_level').default('Beginner'), // Beginner, Intermediate, Advanced
  primaryGoal: text('primary_goal').default('Improve fitness'),
  workoutLocation: text('workout_location').default('Gym'),
  preferredWorkoutDuration: text('preferred_workout_duration').default('30–45 minutes'),
  workoutsPerWeek: integer('workouts_per_week').default(3),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Settings
export const userSettings = pgTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull().unique(),
  weightUnit: text('weight_unit').default('kg').notNull(), // 'kg' | 'lbs'
  distanceUnit: text('distance_unit').default('km').notNull(), // 'km' | 'miles'
  theme: text('theme').default('light').notNull(),
  reminderNotifications: boolean('reminder_notifications').default(true).notNull(),
  streakNotifications: boolean('streak_notifications').default(true).notNull(),
  achievementNotifications: boolean('achievement_notifications').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Goals
export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  goalType: text('goal_type').notNull(), // 'weight', 'workout_frequency', 'workout_streak', 'running_distance', 'strength'
  title: text('title').notNull(),
  description: text('description').default(''),
  targetValue: doublePrecision('target_value').notNull(),
  currentValue: doublePrecision('current_value').default(0).notNull(),
  unit: text('unit').default(''),
  deadline: text('deadline').default(''),
  status: text('status').default('active').notNull(), // 'active', 'completed', 'cancelled'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Exercises library
export const exercises = pgTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  muscleGroup: text('muscle_group').notNull(), // 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Full body'
  equipment: text('equipment').notNull(), // 'Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cables', 'Kettlebell'
  difficulty: text('difficulty').notNull(), // 'Beginner', 'Intermediate', 'Advanced'
  instructions: text('instructions').notNull(),
  imageUrl: text('image_url').default(''),
  videoUrl: text('video_url').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Workouts
export const workouts = pgTable('workouts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  workoutType: text('workout_type').notNull(), // 'strength', 'cardio', 'HIIT', 'running', 'walking', 'cycling', 'yoga', 'stretching', 'custom'
  durationMinutes: integer('duration_minutes').default(0).notNull(),
  caloriesBurned: integer('calories_burned').default(0).notNull(),
  notes: text('notes').default(''),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  status: text('status').default('planned').notNull(), // 'planned', 'in_progress', 'completed', 'cancelled'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Workout Exercises (join table between workout and exercise with order)
export const workoutExercises = pgTable('workout_exercises', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id').references(() => workouts.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Sets
export const sets = pgTable('sets', {
  id: text('id').primaryKey(),
  workoutExerciseId: text('workout_exercise_id').references(() => workoutExercises.id, { onDelete: 'cascade' }).notNull(),
  setNumber: integer('set_number').notNull(),
  weight: doublePrecision('weight').default(0),
  reps: integer('reps').default(0),
  durationSeconds: integer('duration_seconds').default(0),
  distance: doublePrecision('distance').default(0),
  restSeconds: integer('rest_seconds').default(60),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Measurements
export const measurements = pgTable('measurements', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  weight: doublePrecision('weight'),
  bodyFatPercentage: doublePrecision('body_fat_percentage'),
  chest: doublePrecision('chest'),
  waist: doublePrecision('waist'),
  hips: doublePrecision('hips'),
  arms: doublePrecision('arms'),
  thighs: doublePrecision('thighs'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Habits
export const habits = pgTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description').default(''),
  frequency: text('frequency').default('daily').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Habit Logs
export const habitLogs = pgTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  completed: boolean('completed').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('habit_user_date_idx').on(table.habitId, table.date)
]);

// Achievements library
export const achievements = pgTable('achievements', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // Lucide icon name or emoji
  requirementType: text('requirement_type').notNull(), // 'workout_count', 'streak_days'
  requirementValue: integer('requirement_value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Achievements (earned achievements)
export const userAchievements = pgTable('user_achievements', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  achievementId: text('achievement_id').references(() => achievements.id, { onDelete: 'cascade' }).notNull(),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_achievement_idx').on(table.userId, table.achievementId)
]);

// Notifications
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('system').notNull(), // 'reminder', 'streak', 'goal', 'achievement', 'system'
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  settings: one(userSettings, {
    fields: [profiles.id],
    references: [userSettings.userId],
  }),
  goals: many(goals),
  workouts: many(workouts),
  measurements: many(measurements),
  habits: many(habits),
  habitLogs: many(habitLogs),
  userAchievements: many(userAchievements),
  notifications: many(notifications),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(profiles, {
    fields: [workouts.userId],
    references: [profiles.id],
  }),
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(profiles, {
    fields: [habits.userId],
    references: [profiles.id],
  }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(profiles, {
    fields: [userAchievements.userId],
    references: [profiles.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));
