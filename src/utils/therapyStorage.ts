import { Therapy, TherapyFormData } from '../types/therapy';
import { getCollection, connectToDatabase } from '../lib/mongodb';

const defaultTherapies: Therapy[] = [
  {
    id: '1',
    title: 'CBT Thought Records',
    description: 'Cognitive Behavioral Therapy techniques to identify and change negative thought patterns',
    category: 'CBT',
    icon: 'BookOpen',
    color: 'from-blue-500 to-cyan-500',
    duration: '15-20 min',
    difficulty: 'Beginner',
    sessions: 12,
    tags: ['cbt', 'cognitive', 'thoughts'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Mindfulness & Breathing',
    description: 'Evidence-based breathing techniques for anxiety relief and mental clarity',
    category: 'Mindfulness',
    icon: 'Brain',
    color: 'from-green-500 to-teal-500',
    duration: '10-30 min',
    difficulty: 'Beginner',
    sessions: 15,
    tags: ['mindfulness', 'breathing', 'relaxation'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Stress Management',
    description: 'Learn effective coping strategies for managing daily stress and pressure',
    category: 'Stress',
    icon: 'Target',
    color: 'from-orange-500 to-red-500',
    duration: '15-20 min',
    difficulty: 'Beginner',
    sessions: 8,
    tags: ['stress', 'coping', 'management'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Gratitude Journal',
    description: 'Daily gratitude practices to cultivate positivity and appreciation',
    category: 'Positive Psychology',
    icon: 'Heart',
    color: 'from-pink-500 to-rose-500',
    duration: '5-10 min',
    difficulty: 'Beginner',
    sessions: 21,
    tags: ['gratitude', 'journal', 'positivity'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'Relaxation Music',
    description: 'Curated audio library for relaxation and focus',
    category: 'Music Therapy',
    icon: 'Music',
    color: 'from-blue-500 to-purple-500',
    duration: 'Variable',
    difficulty: 'Beginner',
    sessions: 20,
    tags: ['music', 'relaxation', 'audio'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'Tetris Therapy',
    description: 'Gamified stress relief and cognitive enhancement through mindful puzzle-solving',
    category: 'Game Therapy',
    icon: 'Gamepad2',
    color: 'from-cyan-500 to-blue-500',
    duration: '10-15 min',
    difficulty: 'Beginner',
    sessions: 12,
    tags: ['game', 'tetris', 'cognitive'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    title: 'Art & Color Therapy',
    description: 'Creative expression through digital art and therapeutic coloring',
    category: 'Art Therapy',
    icon: 'Palette',
    color: 'from-rose-500 to-pink-500',
    duration: '20-30 min',
    difficulty: 'Beginner',
    sessions: 10,
    tags: ['art', 'color', 'creative'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    title: 'Exposure Therapy',
    description: 'Gradual exposure techniques for anxiety and phobias with safety protocols',
    category: 'Exposure',
    icon: 'Eye',
    color: 'from-yellow-500 to-orange-500',
    duration: '30-45 min',
    difficulty: 'Advanced',
    sessions: 12,
    tags: ['exposure', 'anxiety', 'phobia'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '9',
    title: 'Video Therapy',
    description: 'Professional therapeutic video content with licensed therapists',
    category: 'Video Therapy',
    icon: 'Play',
    color: 'from-blue-500 to-cyan-500',
    duration: '20-40 min',
    difficulty: 'Intermediate',
    sessions: 16,
    tags: ['video', 'guided', 'therapy'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '10',
    title: 'Acceptance & Commitment Therapy',
    description: 'ACT principles for psychological flexibility and values-based living',
    category: 'ACT',
    icon: 'Star',
    color: 'from-teal-500 to-green-500',
    duration: '25-35 min',
    difficulty: 'Intermediate',
    sessions: 14,
    tags: ['act', 'acceptance', 'mindfulness'],
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const getAllTherapies = async (): Promise<Therapy[]> => {
  try {
    await connectToDatabase();
    const therapies = getCollection('therapies');
    const count = await therapies.countDocuments();

    if (count === 0) {
      await therapies.insertMany(defaultTherapies as any);
      return defaultTherapies;
    }

    return (await therapies.find({}).toArray()) as Therapy[];
  } catch (error) {
    console.error('Error fetching therapies:', error);
    return defaultTherapies;
  }
};

export const getTherapyById = async (id: string): Promise<Therapy | undefined> => {
  try {
    await connectToDatabase();
    const therapies = getCollection('therapies');
    const therapy = await therapies.findOne({ id });
    return therapy as Therapy | undefined;
  } catch (error) {
    console.error('Error fetching therapy:', error);
    return undefined;
  }
};

export const createTherapy = async (data: TherapyFormData): Promise<Therapy> => {
  try {
    await connectToDatabase();
    const therapies = getCollection('therapies');

    const newTherapy: Therapy = {
      id: `therapy_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await therapies.insertOne(newTherapy as any);
    window.dispatchEvent(new Event('therapies-updated'));
    return newTherapy;
  } catch (error) {
    console.error('Error creating therapy:', error);
    throw error;
  }
};

export const updateTherapy = async (
  id: string,
  data: Partial<TherapyFormData>
): Promise<Therapy | null> => {
  try {
    await connectToDatabase();
    const therapies = getCollection('therapies');

    const result = await therapies.findOneAndUpdate(
      { id },
      {
        $set: {
          ...data,
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: 'after' }
    );

    window.dispatchEvent(new Event('therapies-updated'));
    return result.value as Therapy | null;
  } catch (error) {
    console.error('Error updating therapy:', error);
    return null;
  }
};

export const deleteTherapy = async (id: string): Promise<boolean> => {
  try {
    await connectToDatabase();
    const therapies = getCollection('therapies');

    const result = await therapies.deleteOne({ id });
    window.dispatchEvent(new Event('therapies-updated'));
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting therapy:', error);
    return false;
  }
};

export const toggleTherapyStatus = async (id: string): Promise<Therapy | null> => {
  try {
    await connectToDatabase();
    const therapies = getCollection('therapies');

    const therapy = await therapies.findOne({ id });
    if (!therapy) return null;

    const newStatus = therapy.status === 'Active' ? 'Inactive' : 'Active';
    return updateTherapy(id, { status: newStatus });
  } catch (error) {
    console.error('Error toggling therapy status:', error);
    return null;
  }
};
