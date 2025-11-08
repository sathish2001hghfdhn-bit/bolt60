import { getCollection, connectToDatabase } from '../lib/mongodb';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: string;
  requirement: number;
  icon: string;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  earned: boolean;
  earnedAt: string | null;
  createdAt: string;
  updatedAt: string;
  achievement?: Achievement;
}

const defaultAchievements: Achievement[] = [
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Completed daily check-ins for 7 days',
    type: 'streak',
    requirement: 7,
    icon: 'flame',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mindfulness_10',
    title: 'Mindfulness Master',
    description: 'Completed 10 meditation sessions',
    type: 'therapy',
    requirement: 10,
    icon: 'brain',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stress_5',
    title: 'Stress Warrior',
    description: 'Successfully managed stress for 5 days',
    type: 'stress',
    requirement: 5,
    icon: 'shield',
    createdAt: new Date().toISOString()
  },
  {
    id: 'therapy_3',
    title: 'Therapy Graduate',
    description: 'Complete 3 therapy modules',
    type: 'therapy',
    requirement: 3,
    icon: 'graduation-cap',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mood_14',
    title: 'Mood Tracker',
    description: 'Track your mood for 14 days',
    type: 'mood',
    requirement: 14,
    icon: 'heart',
    createdAt: new Date().toISOString()
  },
  {
    id: 'early_bird_5',
    title: 'Early Bird',
    description: 'Complete 5 morning meditation sessions',
    type: 'therapy',
    requirement: 5,
    icon: 'sunrise',
    createdAt: new Date().toISOString()
  },
  {
    id: 'streak_30',
    title: 'Consistency Champion',
    description: 'Maintain a 30-day streak',
    type: 'streak',
    requirement: 30,
    icon: 'trophy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'therapy_25',
    title: 'Self-Care Hero',
    description: 'Complete 25 therapy sessions',
    type: 'therapy',
    requirement: 25,
    icon: 'star',
    createdAt: new Date().toISOString()
  }
];

export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    await connectToDatabase();
    const achievements = getCollection('achievements');
    const count = await achievements.countDocuments();

    if (count === 0) {
      await achievements.insertMany(defaultAchievements as any);
      return defaultAchievements;
    }

    return (await achievements.find({}).toArray()) as Achievement[];
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return defaultAchievements;
  }
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    await connectToDatabase();
    const userAchievements = getCollection('user_achievements');
    const achievements = getCollection('achievements');

    const userAchievementsData = (await userAchievements
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()) as any[];

    const enriched = await Promise.all(
      userAchievementsData.map(async (ua) => {
        const achievement = await achievements.findOne({ id: ua.achievementId });
        return {
          ...ua,
          achievement: achievement as Achievement
        };
      })
    );

    return enriched as UserAchievement[];
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
}

export async function initializeUserAchievements(userId: string): Promise<void> {
  try {
    await connectToDatabase();
    const allAchievements = await getAllAchievements();
    const userAchievements = getCollection('user_achievements');

    const existing = await userAchievements
      .find({ userId })
      .project({ achievementId: 1 })
      .toArray();

    const existingIds = new Set(existing.map((e: any) => e.achievementId));

    const newAchievements = allAchievements
      .filter((a) => !existingIds.has(a.id))
      .map((a) => ({
        userId,
        achievementId: a.id,
        progress: 0,
        earned: false,
        earnedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

    if (newAchievements.length > 0) {
      await userAchievements.insertMany(newAchievements as any);
    }
  } catch (error) {
    console.error('Error initializing user achievements:', error);
  }
}

export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  progress: number
): Promise<void> {
  try {
    await connectToDatabase();
    const achievements = getCollection('achievements');
    const userAchievements = getCollection('user_achievements');

    const achievement = await achievements.findOne({ id: achievementId });
    if (!achievement) return;

    const earned = progress >= achievement.requirement;
    const updateData: any = {
      progress,
      earned,
      updatedAt: new Date().toISOString()
    };

    if (earned) {
      const current = await userAchievements.findOne({ userId, achievementId });
      if (current && !current.earned) {
        updateData.earnedAt = new Date().toISOString();
      }
    }

    await userAchievements.updateOne(
      { userId, achievementId },
      { $set: updateData },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating achievement progress:', error);
  }
}

export async function updateAllAchievements(userId: string): Promise<void> {
  try {
    await connectToDatabase();
    await initializeUserAchievements(userId);

    const streakData = JSON.parse(localStorage.getItem('mindcare_streak') || '{"currentStreak": 0}');
    const moodEntries = JSON.parse(localStorage.getItem('mindcare_mood_entries') || '[]');
    const cbtRecords = JSON.parse(localStorage.getItem('mindcare_cbt_records') || '[]');
    const gratitudeEntries = JSON.parse(localStorage.getItem('mindcare_gratitude_entries') || '[]');
    const exposureSessions = JSON.parse(localStorage.getItem('mindcare_exposure_sessions') || '[]');
    const videoProgress = JSON.parse(localStorage.getItem('mindcare_video_progress') || '[]');
    const stressLogs = JSON.parse(localStorage.getItem('mindcare_stress_logs') || '[]');

    const userMoodEntries = moodEntries.filter((e: any) => e.userId === userId);
    const userCBT = cbtRecords.filter((r: any) => r.userId === userId);
    const userGratitude = gratitudeEntries.filter((e: any) => e.userId === userId);
    const userExposure = exposureSessions.filter((s: any) => s.userId === userId);
    const userVideo = videoProgress.filter((p: any) => p.userId === userId);
    const userStressLogs = stressLogs.filter((l: any) => l.userId === userId);

    const currentStreak = streakData.currentStreak || 0;
    const moodTrackDays = userMoodEntries.length;
    const mindfulnessSessions =
      Math.floor(userMoodEntries.length * 0.3) + Math.floor(userGratitude.length * 0.5) + userExposure.length;
    const goodStressDays = userStressLogs.filter((log: any) => log.effectiveness >= 7).length;
    const completedModules = [
      userCBT.length >= 3 ? 1 : 0,
      userGratitude.length >= 7 ? 1 : 0,
      userStressLogs.length >= 3 ? 1 : 0,
      mindfulnessSessions >= 5 ? 1 : 0,
      userVideo.length >= 2 ? 1 : 0
    ].reduce((sum, val) => sum + val, 0);
    const totalTherapySessions =
      userCBT.length + userGratitude.length + userExposure.length + userVideo.length + userStressLogs.length;
    const morningMeditations = 5;

    const achievements = await getAllAchievements();

    for (const achievement of achievements) {
      let progress = 0;

      switch (achievement.type) {
        case 'streak':
          progress = currentStreak;
          break;
        case 'therapy':
          if (achievement.title.includes('meditation')) {
            progress = mindfulnessSessions;
          } else if (achievement.title.includes('Graduate')) {
            progress = completedModules;
          } else if (achievement.title.includes('morning')) {
            progress = morningMeditations;
          } else {
            progress = totalTherapySessions;
          }
          break;
        case 'stress':
          progress = goodStressDays;
          break;
        case 'mood':
          progress = moodTrackDays;
          break;
      }

      await updateAchievementProgress(userId, achievement.id, progress);
    }
  } catch (error) {
    console.error('Error updating all achievements:', error);
  }
}
