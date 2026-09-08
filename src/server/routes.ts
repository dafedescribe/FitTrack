import { Express, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { db } from '../db/index.ts';
import {
  profiles,
  userSettings,
  goals,
  exercises,
  workouts,
  workoutExercises,
  sets,
  measurements,
  habits,
  habitLogs,
  achievements,
  userAchievements,
  notifications,
} from '../db/schema.ts';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';
import crypto from 'crypto';

// Helper to generate UUIDs
const genId = () => crypto.randomUUID();

export function setupApiRoutes(app: Express) {
  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // AUTH & ONBOARDING SYNC
  // -------------------------------------------------------------
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || '';
      const name = req.user!.name || '';
      const picture = req.user!.picture || '';

      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || 'Athlete';
      const lastName = nameParts.slice(1).join(' ');

      // Check existing profile
      const existing = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);

      let profile = existing[0];
      if (!profile) {
        const [newProfile] = await db.insert(profiles).values({
          id: uid,
          email,
          firstName,
          lastName,
          avatarUrl: picture,
          onboardingCompleted: false,
        }).returning();
        profile = newProfile;

        // Default user settings
        await db.insert(userSettings).values({
          id: genId(),
          userId: uid,
          weightUnit: 'kg',
          distanceUnit: 'km',
          theme: 'light',
        }).onConflictDoNothing();

        // Seed 6 default habits for user
        const defaultHabitNames = [
          { name: 'Workout', desc: 'Complete at least 30 minutes of intentional exercise' },
          { name: 'Drink Water', desc: 'Drink at least 2.5 liters of water throughout the day' },
          { name: 'Stretch', desc: '10 minutes of full-body mobility and flexibility' },
          { name: 'Walk', desc: 'Take 8,000+ steps or go for an evening walk' },
          { name: 'Sleep 7+ Hours', desc: 'Prioritize restorative sleep for muscle recovery' },
          { name: 'Healthy Eating', desc: 'Focus on whole foods, adequate protein and vegetables' },
        ];

        for (const h of defaultHabitNames) {
          await db.insert(habits).values({
            id: genId(),
            userId: uid,
            name: h.name,
            description: h.desc,
            frequency: 'daily',
            active: true,
          });
        }

        // Welcome notification
        await db.insert(notifications).values({
          id: genId(),
          userId: uid,
          title: 'Welcome to FitTrack! 👋',
          message: 'Set up your primary fitness goals and start tracking your journey.',
          type: 'system',
        });
      }

      const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, uid)).limit(1);

      res.json({ profile, settings });
    } catch (error: any) {
      console.error('Error in /api/auth/sync:', error);
      res.status(500).json({ error: error.message || 'Failed to sync auth' });
    }
  });

  // -------------------------------------------------------------
  // PROFILES
  // -------------------------------------------------------------
  app.get('/api/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch profile' });
    }
  });

  app.put('/api/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const {
        firstName,
        lastName,
        avatarUrl,
        age,
        height,
        currentWeight,
        fitnessLevel,
        primaryGoal,
        workoutLocation,
        preferredWorkoutDuration,
        workoutsPerWeek,
        onboardingCompleted,
      } = req.body;

      const [updated] = await db.update(profiles)
        .set({
          firstName: firstName !== undefined ? firstName : undefined,
          lastName: lastName !== undefined ? lastName : undefined,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
          age: age !== undefined ? Number(age) || null : undefined,
          height: height !== undefined ? Number(height) || null : undefined,
          currentWeight: currentWeight !== undefined ? Number(currentWeight) || null : undefined,
          fitnessLevel: fitnessLevel !== undefined ? fitnessLevel : undefined,
          primaryGoal: primaryGoal !== undefined ? primaryGoal : undefined,
          workoutLocation: workoutLocation !== undefined ? workoutLocation : undefined,
          preferredWorkoutDuration: preferredWorkoutDuration !== undefined ? preferredWorkoutDuration : undefined,
          workoutsPerWeek: workoutsPerWeek !== undefined ? Number(workoutsPerWeek) || 3 : undefined,
          onboardingCompleted: onboardingCompleted !== undefined ? Boolean(onboardingCompleted) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, uid))
        .returning();

      // If currentWeight was updated, record in measurements
      if (currentWeight !== undefined && Number(currentWeight) > 0) {
        await db.insert(measurements).values({
          id: genId(),
          userId: uid,
          weight: Number(currentWeight),
          recordedAt: new Date(),
        });
      }

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  // -------------------------------------------------------------
  // USER SETTINGS
  // -------------------------------------------------------------
  app.get('/api/settings', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      let [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, uid)).limit(1);
      if (!settings) {
        const [created] = await db.insert(userSettings).values({
          id: genId(),
          userId: uid,
          weightUnit: 'kg',
          distanceUnit: 'km',
          theme: 'light',
        }).returning();
        settings = created;
      }
      res.json(settings);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { weightUnit, distanceUnit, theme, reminderNotifications, streakNotifications, achievementNotifications } = req.body;

      const [updated] = await db.update(userSettings)
        .set({
          weightUnit: weightUnit !== undefined ? weightUnit : undefined,
          distanceUnit: distanceUnit !== undefined ? distanceUnit : undefined,
          theme: theme !== undefined ? theme : undefined,
          reminderNotifications: reminderNotifications !== undefined ? Boolean(reminderNotifications) : undefined,
          streakNotifications: streakNotifications !== undefined ? Boolean(streakNotifications) : undefined,
          achievementNotifications: achievementNotifications !== undefined ? Boolean(achievementNotifications) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, uid))
        .returning();

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: error.message || 'Failed to update settings' });
    }
  });

  // -------------------------------------------------------------
  // EXERCISES LIBRARY
  // -------------------------------------------------------------
  app.get('/api/exercises', async (req, res) => {
    try {
      const { search, muscleGroup, equipment, difficulty } = req.query;
      let query = db.select().from(exercises);

      const conditions = [];
      if (muscleGroup && muscleGroup !== 'all') {
        conditions.push(eq(exercises.muscleGroup, String(muscleGroup)));
      }
      if (equipment && equipment !== 'all') {
        conditions.push(eq(exercises.equipment, String(equipment)));
      }
      if (difficulty && difficulty !== 'all') {
        conditions.push(eq(exercises.difficulty, String(difficulty)));
      }
      if (search) {
        const searchStr = `%${String(search).toLowerCase()}%`;
        conditions.push(sql`LOWER(${exercises.name}) LIKE ${searchStr} OR LOWER(${exercises.description}) LIKE ${searchStr}`);
      }

      const allExercises = conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(asc(exercises.name))
        : await query.orderBy(asc(exercises.name));

      res.json(allExercises);
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch exercises' });
    }
  });

  app.get('/api/exercises/:id', async (req, res) => {
    try {
      const [exercise] = await db.select().from(exercises).where(eq(exercises.id, req.params.id)).limit(1);
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }
      res.json(exercise);
    } catch (error: any) {
      console.error('Error fetching exercise details:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch exercise' });
    }
  });

  // -------------------------------------------------------------
  // GOALS
  // -------------------------------------------------------------
  app.get('/api/goals', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const userGoals = await db.select()
        .from(goals)
        .where(eq(goals.userId, uid))
        .orderBy(desc(goals.createdAt));
      res.json(userGoals);
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch goals' });
    }
  });

  app.post('/api/goals', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { goalType, title, description, targetValue, currentValue, unit, deadline } = req.body;

      if (!title || targetValue === undefined) {
        return res.status(400).json({ error: 'Title and target value are required' });
      }

      const [newGoal] = await db.insert(goals).values({
        id: genId(),
        userId: uid,
        goalType: goalType || 'weight',
        title,
        description: description || '',
        targetValue: Number(targetValue),
        currentValue: Number(currentValue) || 0,
        unit: unit || 'kg',
        deadline: deadline || '',
        status: 'active',
      }).returning();

      res.status(201).json(newGoal);
    } catch (error: any) {
      console.error('Error creating goal:', error);
      res.status(500).json({ error: error.message || 'Failed to create goal' });
    }
  });

  app.put('/api/goals/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { goalType, title, description, targetValue, currentValue, unit, deadline, status } = req.body;

      const [updated] = await db.update(goals)
        .set({
          goalType: goalType !== undefined ? goalType : undefined,
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          targetValue: targetValue !== undefined ? Number(targetValue) : undefined,
          currentValue: currentValue !== undefined ? Number(currentValue) : undefined,
          unit: unit !== undefined ? unit : undefined,
          deadline: deadline !== undefined ? deadline : undefined,
          status: status !== undefined ? status : undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(goals.id, req.params.id), eq(goals.userId, uid)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating goal:', error);
      res.status(500).json({ error: error.message || 'Failed to update goal' });
    }
  });

  app.delete('/api/goals/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const deleted = await db.delete(goals)
        .where(and(eq(goals.id, req.params.id), eq(goals.userId, uid)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      res.status(500).json({ error: error.message || 'Failed to delete goal' });
    }
  });

  // -------------------------------------------------------------
  // WORKOUTS
  // -------------------------------------------------------------
  app.get('/api/workouts', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { status, limit } = req.query;

      const conditions = [eq(workouts.userId, uid)];
      if (status && status !== 'all') {
        conditions.push(eq(workouts.status, String(status)));
      }

      let q = db.select().from(workouts).where(and(...conditions)).orderBy(desc(workouts.createdAt));
      if (limit) {
        q = q.limit(Number(limit)) as any;
      }

      const userWorkouts = await q;

      // Enhance with exercise counts
      const workoutIds = userWorkouts.map(w => w.id);
      let exerciseCountMap: Record<string, number> = {};

      if (workoutIds.length > 0) {
        const counts = await db.select({
          workoutId: workoutExercises.workoutId,
          count: sql<number>`count(*)`,
        })
          .from(workoutExercises)
          .where(inArray(workoutExercises.workoutId, workoutIds))
          .groupBy(workoutExercises.workoutId);

        counts.forEach(c => {
          exerciseCountMap[c.workoutId] = Number(c.count);
        });
      }

      const enriched = userWorkouts.map(w => ({
        ...w,
        exerciseCount: exerciseCountMap[w.id] || 0,
      }));

      res.json(enriched);
    } catch (error: any) {
      console.error('Error fetching workouts:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch workouts' });
    }
  });

  // Get single workout with exercises and sets
  app.get('/api/workouts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const [workout] = await db.select()
        .from(workouts)
        .where(and(eq(workouts.id, req.params.id), eq(workouts.userId, uid)))
        .limit(1);

      if (!workout) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      // Fetch workout exercises joined with exercise library
      const weList = await db.select({
        id: workoutExercises.id,
        workoutId: workoutExercises.workoutId,
        exerciseId: workoutExercises.exerciseId,
        orderIndex: workoutExercises.orderIndex,
        notes: workoutExercises.notes,
        createdAt: workoutExercises.createdAt,
        name: exercises.name,
        muscleGroup: exercises.muscleGroup,
        equipment: exercises.equipment,
        difficulty: exercises.difficulty,
        instructions: exercises.instructions,
      })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(eq(workoutExercises.workoutId, workout.id))
        .orderBy(asc(workoutExercises.orderIndex));

      // Fetch all sets for these workout exercises
      const weIds = weList.map(we => we.id);
      let setsMap: Record<string, any[]> = {};

      if (weIds.length > 0) {
        const allSets = await db.select()
          .from(sets)
          .where(inArray(sets.workoutExerciseId, weIds))
          .orderBy(asc(sets.setNumber));

        allSets.forEach(s => {
          if (!setsMap[s.workoutExerciseId]) setsMap[s.workoutExerciseId] = [];
          setsMap[s.workoutExerciseId].push(s);
        });
      }

      const fullExercises = weList.map(we => ({
        ...we,
        sets: setsMap[we.id] || [],
      }));

      res.json({
        ...workout,
        exercises: fullExercises,
      });
    } catch (error: any) {
      console.error('Error fetching workout details:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch workout details' });
    }
  });

  // Create workout (supports initial exercise IDs)
  app.post('/api/workouts', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { name, workoutType, notes, status, exerciseIds } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Workout name is required' });
      }

      const workoutId = genId();
      const isStartNow = status === 'in_progress';

      const [newWorkout] = await db.insert(workouts).values({
        id: workoutId,
        userId: uid,
        name,
        workoutType: workoutType || 'strength',
        notes: notes || '',
        status: status || 'planned',
        startedAt: isStartNow ? new Date() : null,
      }).returning();

      // If initial exercises provided
      if (Array.isArray(exerciseIds) && exerciseIds.length > 0) {
        for (let i = 0; i < exerciseIds.length; i++) {
          const exId = exerciseIds[i];
          const weId = genId();
          await db.insert(workoutExercises).values({
            id: weId,
            workoutId,
            exerciseId: exId,
            orderIndex: i,
          });

          // Insert 3 starter sets
          for (let s = 1; s <= 3; s++) {
            await db.insert(sets).values({
              id: genId(),
              workoutExerciseId: weId,
              setNumber: s,
              weight: 20,
              reps: 10,
              restSeconds: 60,
              completed: false,
            });
          }
        }
      }

      res.status(201).json(newWorkout);
    } catch (error: any) {
      console.error('Error creating workout:', error);
      res.status(500).json({ error: error.message || 'Failed to create workout' });
    }
  });

  // Update workout
  app.put('/api/workouts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { name, workoutType, durationMinutes, caloriesBurned, notes, status, startedAt, completedAt } = req.body;

      const [updated] = await db.update(workouts)
        .set({
          name: name !== undefined ? name : undefined,
          workoutType: workoutType !== undefined ? workoutType : undefined,
          durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
          caloriesBurned: caloriesBurned !== undefined ? Number(caloriesBurned) : undefined,
          notes: notes !== undefined ? notes : undefined,
          status: status !== undefined ? status : undefined,
          startedAt: startedAt !== undefined ? (startedAt ? new Date(startedAt) : null) : undefined,
          completedAt: completedAt !== undefined ? (completedAt ? new Date(completedAt) : null) : undefined,
        })
        .where(and(eq(workouts.id, req.params.id), eq(workouts.userId, uid)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      // If workout is finished (status: completed), trigger achievement checks and streak check
      let newlyEarned: any[] = [];
      let streakInfo = { currentStreak: 0, longestStreak: 0 };

      if (status === 'completed') {
        // Automatically check achievements
        const checkRes = await evaluateAchievements(uid);
        newlyEarned = checkRes.newlyEarned;
        streakInfo = await calculateStreaks(uid);

        // Mark habit "Workout" as completed for today if exists
        const todayStr = new Date().toISOString().split('T')[0];
        const [workoutHabit] = await db.select().from(habits).where(and(eq(habits.userId, uid), eq(habits.name, 'Workout'))).limit(1);
        if (workoutHabit) {
          await db.insert(habitLogs).values({
            id: genId(),
            habitId: workoutHabit.id,
            userId: uid,
            date: todayStr,
            completed: true,
          }).onConflictDoNothing();
        }
      }

      res.json({
        ...updated,
        newlyEarnedAchievements: newlyEarned,
        streak: streakInfo,
      });
    } catch (error: any) {
      console.error('Error updating workout:', error);
      res.status(500).json({ error: error.message || 'Failed to update workout' });
    }
  });

  // Delete workout
  app.delete('/api/workouts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const deleted = await db.delete(workouts)
        .where(and(eq(workouts.id, req.params.id), eq(workouts.userId, uid)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting workout:', error);
      res.status(500).json({ error: error.message || 'Failed to delete workout' });
    }
  });

  // Duplicate workout
  app.post('/api/workouts/:id/duplicate', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const [sourceWorkout] = await db.select()
        .from(workouts)
        .where(and(eq(workouts.id, req.params.id), eq(workouts.userId, uid)))
        .limit(1);

      if (!sourceWorkout) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      const newWorkoutId = genId();
      const [newWorkout] = await db.insert(workouts).values({
        id: newWorkoutId,
        userId: uid,
        name: `${sourceWorkout.name} (Copy)`,
        workoutType: sourceWorkout.workoutType,
        notes: sourceWorkout.notes,
        status: 'planned',
      }).returning();

      // Fetch exercises
      const sourceExercises = await db.select()
        .from(workoutExercises)
        .where(eq(workoutExercises.workoutId, sourceWorkout.id))
        .orderBy(asc(workoutExercises.orderIndex));

      for (const se of sourceExercises) {
        const newWeId = genId();
        await db.insert(workoutExercises).values({
          id: newWeId,
          workoutId: newWorkoutId,
          exerciseId: se.exerciseId,
          orderIndex: se.orderIndex,
          notes: se.notes,
        });

        // Copy sets
        const sourceSets = await db.select()
          .from(sets)
          .where(eq(sets.workoutExerciseId, se.id))
          .orderBy(asc(sets.setNumber));

        for (const s of sourceSets) {
          await db.insert(sets).values({
            id: genId(),
            workoutExerciseId: newWeId,
            setNumber: s.setNumber,
            weight: s.weight,
            reps: s.reps,
            durationSeconds: s.durationSeconds,
            distance: s.distance,
            restSeconds: s.restSeconds,
            completed: false, // reset completed flag
          });
        }
      }

      res.status(201).json(newWorkout);
    } catch (error: any) {
      console.error('Error duplicating workout:', error);
      res.status(500).json({ error: error.message || 'Failed to duplicate workout' });
    }
  });

  // Add exercise to workout
  app.post('/api/workouts/:id/exercises', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { exerciseId } = req.body;

      if (!exerciseId) {
        return res.status(400).json({ error: 'Exercise ID is required' });
      }

      // Check workout ownership
      const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, req.params.id), eq(workouts.userId, uid))).limit(1);
      if (!workout) return res.status(404).json({ error: 'Workout not found' });

      // Get count for order index
      const existing = await db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, workout.id));
      const newWeId = genId();

      const [newWe] = await db.insert(workoutExercises).values({
        id: newWeId,
        workoutId: workout.id,
        exerciseId,
        orderIndex: existing.length,
      }).returning();

      // Create 3 starter sets
      const starterSets = [];
      for (let i = 1; i <= 3; i++) {
        const [newSet] = await db.insert(sets).values({
          id: genId(),
          workoutExerciseId: newWeId,
          setNumber: i,
          weight: 20,
          reps: 10,
          restSeconds: 60,
          completed: false,
        }).returning();
        starterSets.push(newSet);
      }

      const [exerciseInfo] = await db.select().from(exercises).where(eq(exercises.id, exerciseId)).limit(1);

      res.status(201).json({
        ...newWe,
        name: exerciseInfo?.name,
        muscleGroup: exerciseInfo?.muscleGroup,
        equipment: exerciseInfo?.equipment,
        difficulty: exerciseInfo?.difficulty,
        sets: starterSets,
      });
    } catch (error: any) {
      console.error('Error adding exercise to workout:', error);
      res.status(500).json({ error: error.message || 'Failed to add exercise' });
    }
  });

  // Remove exercise from workout
  app.delete('/api/workouts/exercises/:workoutExerciseId', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const [we] = await db.select({
        id: workoutExercises.id,
        workoutId: workoutExercises.workoutId,
        userId: workouts.userId,
      })
        .from(workoutExercises)
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(and(eq(workoutExercises.id, req.params.workoutExerciseId), eq(workouts.userId, uid)))
        .limit(1);

      if (!we) {
        return res.status(404).json({ error: 'Workout exercise not found' });
      }

      await db.delete(workoutExercises).where(eq(workoutExercises.id, we.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error removing workout exercise:', error);
      res.status(500).json({ error: error.message || 'Failed to remove exercise' });
    }
  });

  // Add set to workout exercise
  app.post('/api/workouts/exercises/:workoutExerciseId/sets', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const [we] = await db.select({
        id: workoutExercises.id,
        userId: workouts.userId,
      })
        .from(workoutExercises)
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(and(eq(workoutExercises.id, req.params.workoutExerciseId), eq(workouts.userId, uid)))
        .limit(1);

      if (!we) {
        return res.status(404).json({ error: 'Workout exercise not found' });
      }

      const existingSets = await db.select().from(sets).where(eq(sets.workoutExerciseId, we.id)).orderBy(asc(sets.setNumber));
      const lastSet = existingSets[existingSets.length - 1];

      const [newSet] = await db.insert(sets).values({
        id: genId(),
        workoutExerciseId: we.id,
        setNumber: existingSets.length + 1,
        weight: lastSet ? lastSet.weight : 20,
        reps: lastSet ? lastSet.reps : 10,
        durationSeconds: lastSet ? lastSet.durationSeconds : 0,
        distance: lastSet ? lastSet.distance : 0,
        restSeconds: 60,
        completed: false,
      }).returning();

      res.status(201).json(newSet);
    } catch (error: any) {
      console.error('Error adding set:', error);
      res.status(500).json({ error: error.message || 'Failed to add set' });
    }
  });

  // Update set (instant autosave)
  app.put('/api/sets/:setId', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { weight, reps, durationSeconds, distance, restSeconds, completed } = req.body;

      // Verify ownership
      const [s] = await db.select({
        id: sets.id,
        userId: workouts.userId,
      })
        .from(sets)
        .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(and(eq(sets.id, req.params.setId), eq(workouts.userId, uid)))
        .limit(1);

      if (!s) {
        return res.status(404).json({ error: 'Set not found' });
      }

      const [updated] = await db.update(sets)
        .set({
          weight: weight !== undefined ? Number(weight) : undefined,
          reps: reps !== undefined ? Number(reps) : undefined,
          durationSeconds: durationSeconds !== undefined ? Number(durationSeconds) : undefined,
          distance: distance !== undefined ? Number(distance) : undefined,
          restSeconds: restSeconds !== undefined ? Number(restSeconds) : undefined,
          completed: completed !== undefined ? Boolean(completed) : undefined,
        })
        .where(eq(sets.id, req.params.setId))
        .returning();

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating set:', error);
      res.status(500).json({ error: error.message || 'Failed to update set' });
    }
  });

  // Delete set
  app.delete('/api/sets/:setId', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const [s] = await db.select({
        id: sets.id,
        workoutExerciseId: sets.workoutExerciseId,
        userId: workouts.userId,
      })
        .from(sets)
        .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(and(eq(sets.id, req.params.setId), eq(workouts.userId, uid)))
        .limit(1);

      if (!s) {
        return res.status(404).json({ error: 'Set not found' });
      }

      await db.delete(sets).where(eq(sets.id, s.id));

      // Reorder remaining sets
      const remaining = await db.select().from(sets).where(eq(sets.workoutExerciseId, s.workoutExerciseId)).orderBy(asc(sets.setNumber));
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].setNumber !== i + 1) {
          await db.update(sets).set({ setNumber: i + 1 }).where(eq(sets.id, remaining[i].id));
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting set:', error);
      res.status(500).json({ error: error.message || 'Failed to delete set' });
    }
  });

  // -------------------------------------------------------------
  // BODY MEASUREMENTS
  // -------------------------------------------------------------
  app.get('/api/measurements', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const userMeasurements = await db.select()
        .from(measurements)
        .where(eq(measurements.userId, uid))
        .orderBy(desc(measurements.recordedAt));
      res.json(userMeasurements);
    } catch (error: any) {
      console.error('Error fetching measurements:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch measurements' });
    }
  });

  app.post('/api/measurements', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { weight, bodyFatPercentage, chest, waist, hips, arms, thighs, recordedAt } = req.body;

      const [newMeasurement] = await db.insert(measurements).values({
        id: genId(),
        userId: uid,
        weight: weight !== undefined && weight !== '' ? Number(weight) : null,
        bodyFatPercentage: bodyFatPercentage !== undefined && bodyFatPercentage !== '' ? Number(bodyFatPercentage) : null,
        chest: chest !== undefined && chest !== '' ? Number(chest) : null,
        waist: waist !== undefined && waist !== '' ? Number(waist) : null,
        hips: hips !== undefined && hips !== '' ? Number(hips) : null,
        arms: arms !== undefined && arms !== '' ? Number(arms) : null,
        thighs: thighs !== undefined && thighs !== '' ? Number(thighs) : null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      }).returning();

      // Also update current weight on profile if weight was recorded
      if (weight !== undefined && weight !== '' && Number(weight) > 0) {
        await db.update(profiles).set({ currentWeight: Number(weight) }).where(eq(profiles.id, uid));
      }

      res.status(201).json(newMeasurement);
    } catch (error: any) {
      console.error('Error saving measurement:', error);
      res.status(500).json({ error: error.message || 'Failed to record measurement' });
    }
  });

  app.delete('/api/measurements/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const deleted = await db.delete(measurements)
        .where(and(eq(measurements.id, req.params.id), eq(measurements.userId, uid)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Measurement not found' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting measurement:', error);
      res.status(500).json({ error: error.message || 'Failed to delete measurement' });
    }
  });

  // -------------------------------------------------------------
  // HABITS
  // -------------------------------------------------------------
  app.get('/api/habits', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const userHabits = await db.select().from(habits).where(eq(habits.userId, uid)).orderBy(asc(habits.createdAt));

      // Fetch logs for the past 14 days
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

      const logs = await db.select()
        .from(habitLogs)
        .where(and(eq(habitLogs.userId, uid), sql`${habitLogs.date} >= ${twoWeeksAgoStr}`));

      const logMap: Record<string, Record<string, boolean>> = {};
      logs.forEach(l => {
        if (!logMap[l.habitId]) logMap[l.habitId] = {};
        logMap[l.habitId][l.date] = l.completed;
      });

      const enrichedHabits = userHabits.map(h => ({
        ...h,
        logs: logMap[h.id] || {},
      }));

      res.json(enrichedHabits);
    } catch (error: any) {
      console.error('Error fetching habits:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch habits' });
    }
  });

  app.post('/api/habits', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { name, description, frequency } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Habit name is required' });
      }

      const [newHabit] = await db.insert(habits).values({
        id: genId(),
        userId: uid,
        name,
        description: description || '',
        frequency: frequency || 'daily',
        active: true,
      }).returning();

      res.status(201).json({ ...newHabit, logs: {} });
    } catch (error: any) {
      console.error('Error creating habit:', error);
      res.status(500).json({ error: error.message || 'Failed to create habit' });
    }
  });

  app.put('/api/habits/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { name, description, active } = req.body;

      const [updated] = await db.update(habits)
        .set({
          name: name !== undefined ? name : undefined,
          description: description !== undefined ? description : undefined,
          active: active !== undefined ? Boolean(active) : undefined,
        })
        .where(and(eq(habits.id, req.params.id), eq(habits.userId, uid)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating habit:', error);
      res.status(500).json({ error: error.message || 'Failed to update habit' });
    }
  });

  app.delete('/api/habits/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const deleted = await db.delete(habits)
        .where(and(eq(habits.id, req.params.id), eq(habits.userId, uid)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting habit:', error);
      res.status(500).json({ error: error.message || 'Failed to delete habit' });
    }
  });

  // Toggle habit log for a given date
  app.post('/api/habits/:id/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { date } = req.body;
      const dateStr = date || new Date().toISOString().split('T')[0];

      // Check if log exists
      const [existing] = await db.select()
        .from(habitLogs)
        .where(and(eq(habitLogs.habitId, req.params.id), eq(habitLogs.date, dateStr)))
        .limit(1);

      if (existing) {
        // Toggle or remove
        if (existing.completed) {
          await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
          return res.json({ completed: false, date: dateStr });
        } else {
          await db.update(habitLogs).set({ completed: true }).where(eq(habitLogs.id, existing.id));
          return res.json({ completed: true, date: dateStr });
        }
      } else {
        await db.insert(habitLogs).values({
          id: genId(),
          habitId: req.params.id,
          userId: uid,
          date: dateStr,
          completed: true,
        });
        return res.json({ completed: true, date: dateStr });
      }
    } catch (error: any) {
      console.error('Error toggling habit log:', error);
      res.status(500).json({ error: error.message || 'Failed to toggle habit log' });
    }
  });

  // -------------------------------------------------------------
  // ACHIEVEMENTS
  // -------------------------------------------------------------
  app.get('/api/achievements', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const allAchievements = await db.select().from(achievements).orderBy(asc(achievements.requirementValue));
      const userEarned = await db.select().from(userAchievements).where(eq(userAchievements.userId, uid));

      const earnedMap = new Map(userEarned.map(e => [e.achievementId, e.earnedAt]));

      const combined = allAchievements.map(a => ({
        ...a,
        isEarned: earnedMap.has(a.id),
        earnedAt: earnedMap.get(a.id) || null,
      }));

      res.json(combined);
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch achievements' });
    }
  });

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const userNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, uid))
        .orderBy(desc(notifications.createdAt))
        .limit(20);
      res.json(userNotifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
  });

  app.put('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      await db.update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, uid)));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating notification:', error);
      res.status(500).json({ error: error.message || 'Failed to update notification' });
    }
  });

  app.put('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, uid));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking all notifications read:', error);
      res.status(500).json({ error: error.message || 'Failed to update notifications' });
    }
  });

  // -------------------------------------------------------------
  // DASHBOARD & ANALYTICS
  // -------------------------------------------------------------
  app.get('/api/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;

      // 1. Profile
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);

      // 2. Primary Goal
      const [primaryGoal] = await db.select()
        .from(goals)
        .where(and(eq(goals.userId, uid), eq(goals.status, 'active')))
        .orderBy(desc(goals.createdAt))
        .limit(1);

      // 3. Workouts this week (Monday through Sunday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + distanceToMonday);
      monday.setHours(0, 0, 0, 0);

      const completedWorkoutsThisWeek = await db.select()
        .from(workouts)
        .where(and(
          eq(workouts.userId, uid),
          eq(workouts.status, 'completed'),
          sql`${workouts.completedAt} >= ${monday}`
        ));

      // Calculate total workout time this week
      const totalWorkoutMinutes = completedWorkoutsThisWeek.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

      // Weekly activity grid (Mon - Sun)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekActivity = days.map((dayName, index) => {
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + index);
        const dateStr = targetDate.toISOString().split('T')[0];

        const hasWorkout = completedWorkoutsThisWeek.some(w => {
          if (!w.completedAt) return false;
          return new Date(w.completedAt).toISOString().split('T')[0] === dateStr;
        });

        const isToday = now.toISOString().split('T')[0] === dateStr;

        return {
          day: dayName,
          date: dateStr,
          completed: hasWorkout,
          isToday,
        };
      });

      // 4. Streaks
      const streakInfo = await calculateStreaks(uid);

      // 5. Achievements earned count
      const userAchievementsList = await db.select().from(userAchievements).where(eq(userAchievements.userId, uid));

      // 6. Today's or next workout
      const todayStr = now.toISOString().split('T')[0];
      const todayWorkouts = await db.select()
        .from(workouts)
        .where(and(
          eq(workouts.userId, uid),
          sql`DATE(${workouts.createdAt}) = ${todayStr} OR DATE(${workouts.startedAt}) = ${todayStr}`
        ))
        .limit(1);

      const [nextPlanned] = await db.select()
        .from(workouts)
        .where(and(eq(workouts.userId, uid), eq(workouts.status, 'planned')))
        .orderBy(desc(workouts.createdAt))
        .limit(1);

      const todayWorkout = todayWorkouts[0] || nextPlanned || null;

      // 7. Recent workouts (completed or in progress)
      const recentWorkouts = await db.select()
        .from(workouts)
        .where(eq(workouts.userId, uid))
        .orderBy(desc(workouts.createdAt))
        .limit(5);

      res.json({
        profile,
        primaryGoal: primaryGoal || null,
        stats: {
          workoutsThisWeek: completedWorkoutsThisWeek.length,
          totalWorkoutMinutes,
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          achievementsEarned: userAchievementsList.length,
        },
        weekActivity,
        todayWorkout,
        recentWorkouts,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
    }
  });

  // Analytics endpoint for Progress page
  app.get('/api/progress/analytics', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;

      // 1. Weight history from measurements
      const weightHistory = await db.select({
        id: measurements.id,
        weight: measurements.weight,
        bodyFat: measurements.bodyFatPercentage,
        recordedAt: measurements.recordedAt,
      })
        .from(measurements)
        .where(and(eq(measurements.userId, uid), sql`${measurements.weight} IS NOT NULL`))
        .orderBy(asc(measurements.recordedAt));

      const formattedWeight = weightHistory.map(m => ({
        date: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: m.weight,
        bodyFat: m.bodyFat,
      }));

      // 2. Workout frequency (workouts grouped by week)
      const allCompleted = await db.select()
        .from(workouts)
        .where(and(eq(workouts.userId, uid), eq(workouts.status, 'completed'), sql`${workouts.completedAt} IS NOT NULL`))
        .orderBy(asc(workouts.completedAt));

      // Group completed workouts by week
      const weeklyFrequencyMap: Record<string, { count: number; duration: number }> = {};
      allCompleted.forEach(w => {
        const d = new Date(w.completedAt!);
        // format as Month Day (e.g. "Aug 24")
        const weekKey = `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        if (!weeklyFrequencyMap[weekKey]) {
          weeklyFrequencyMap[weekKey] = { count: 0, duration: 0 };
        }
        weeklyFrequencyMap[weekKey].count += 1;
        weeklyFrequencyMap[weekKey].duration += (w.durationMinutes || 0);
      });

      const workoutFrequencyData = Object.entries(weeklyFrequencyMap).map(([week, data]) => ({
        week,
        workouts: data.count,
        duration: data.duration,
      }));

      // 3. Exercise strength progression: For any exercise, highest weight lifted per workout
      const exerciseProgressionList = await db.select({
        exerciseId: workoutExercises.exerciseId,
        exerciseName: exercises.name,
        workoutDate: workouts.completedAt,
        maxWeight: sql<number>`MAX(${sets.weight})`,
        maxReps: sql<number>`MAX(${sets.reps})`,
      })
        .from(sets)
        .innerJoin(workoutExercises, eq(sets.workoutExerciseId, workoutExercises.id))
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(and(
          eq(workouts.userId, uid),
          eq(workouts.status, 'completed'),
          eq(sets.completed, true),
          sql`${sets.weight} > 0`
        ))
        .groupBy(workoutExercises.exerciseId, exercises.name, workouts.completedAt)
        .orderBy(asc(workouts.completedAt));

      res.json({
        weightHistory: formattedWeight,
        workoutFrequency: workoutFrequencyData,
        exerciseProgression: exerciseProgressionList.map(ep => ({
          exerciseId: ep.exerciseId,
          exerciseName: ep.exerciseName,
          date: new Date(ep.workoutDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          maxWeight: Number(ep.maxWeight),
          reps: Number(ep.maxReps),
        })),
      });
    } catch (error: any) {
      console.error('Error fetching progress analytics:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch progress analytics' });
    }
  });

  // Calendar endpoint: workouts and habits for a given year/month
  app.get('/api/calendar', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { year, month } = req.query; // month 1-12

      const y = Number(year) || new Date().getFullYear();
      const m = Number(month) || new Date().getMonth() + 1;

      // Start & end date of month
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // Workouts in this date range
      const monthWorkouts = await db.select()
        .from(workouts)
        .where(and(
          eq(workouts.userId, uid),
          sql`DATE(${workouts.createdAt}) >= ${startDate} AND DATE(${workouts.createdAt}) <= ${endDate}`
        ));

      // Habits logs in this date range
      const monthHabitLogs = await db.select({
        id: habitLogs.id,
        date: habitLogs.date,
        completed: habitLogs.completed,
        habitName: habits.name,
      })
        .from(habitLogs)
        .innerJoin(habits, eq(habitLogs.habitId, habits.id))
        .where(and(
          eq(habitLogs.userId, uid),
          sql`${habitLogs.date} >= ${startDate} AND ${habitLogs.date} <= ${endDate}`,
          eq(habitLogs.completed, true)
        ));

      res.json({
        workouts: monthWorkouts,
        habitLogs: monthHabitLogs,
      });
    } catch (error: any) {
      console.error('Error fetching calendar data:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch calendar data' });
    }
  });
}

// -------------------------------------------------------------
// REUSABLE BUSINESS LOGIC HELPERS
// -------------------------------------------------------------
async function calculateStreaks(userId: string) {
  // Get all completed workout dates (distinct 'YYYY-MM-DD')
  const completed = await db.select({
    dateStr: sql<string>`DISTINCT TO_CHAR(${workouts.completedAt}, 'YYYY-MM-DD')`,
  })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.status, 'completed'), sql`${workouts.completedAt} IS NOT NULL`))
    .orderBy(desc(sql`TO_CHAR(${workouts.completedAt}, 'YYYY-MM-DD')`));

  if (completed.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dateStrings = completed.map(c => c.dateStr);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Current streak
  let currentStreak = 0;
  let cursor = new Date(today);

  // Check if today is completed
  const hasToday = dateStrings.includes(todayStr);
  const hasYesterday = dateStrings.includes(yesterdayStr);

  if (!hasToday && !hasYesterday) {
    currentStreak = 0;
  } else {
    // If not completed today, start checking from yesterday
    cursor = hasToday ? new Date(today) : new Date(yesterday);
    while (true) {
      const curStr = cursor.toISOString().split('T')[0];
      if (dateStrings.includes(curStr)) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  if (dateStrings.length > 0) {
    // Convert to sorted timestamps
    const timestamps = dateStrings.map(d => new Date(d).getTime()).sort((a, b) => a - b);
    tempStreak = 1;
    longestStreak = 1;
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.round((timestamps[i] - timestamps[i - 1]) / oneDayMs);
      if (diff === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

async function evaluateAchievements(userId: string) {
  // Count total completed workouts
  const [completedCountResult] = await db.select({
    count: sql<number>`count(*)`,
  })
    .from(workouts)
    .where(and(eq(workouts.userId, userId), eq(workouts.status, 'completed')));

  const totalCompleted = Number(completedCountResult?.count || 0);

  // Streak
  const { currentStreak } = await calculateStreaks(userId);

  // Get already earned
  const alreadyEarned = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  const earnedSet = new Set(alreadyEarned.map(e => e.achievementId));

  // Get all achievements
  const allAchievements = await db.select().from(achievements);
  const newlyEarned: any[] = [];

  for (const ach of allAchievements) {
    if (earnedSet.has(ach.id)) continue;

    let qualifies = false;
    if (ach.requirementType === 'workout_count' && totalCompleted >= ach.requirementValue) {
      qualifies = true;
    } else if (ach.requirementType === 'streak_days' && currentStreak >= ach.requirementValue) {
      qualifies = true;
    }

    if (qualifies) {
      await db.insert(userAchievements).values({
        id: crypto.randomUUID(),
        userId,
        achievementId: ach.id,
        earnedAt: new Date(),
      }).onConflictDoNothing();

      // Create notification
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId,
        title: `Achievement Unlocked: ${ach.name}! 🏆`,
        message: ach.description,
        type: 'achievement',
      });

      newlyEarned.push(ach);
    }
  }

  return { newlyEarned };
}
