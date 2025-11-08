import { getCollection, connectToDatabase } from './mongodb';

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your_jwt_secret_key';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'therapist' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
  profilePicture?: string;
  profilePhotoUrl?: string;
  emergencyContactEmail?: string;
  emergencyContactRelation?: string;
  age?: number;
  specialization?: string;
  experience?: string;
  location?: string;
  hourlyRate?: number;
  licenseNumber?: string;
  verified?: boolean;
  phone?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return btoa(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return btoa(password) === hash;
}

export function generateToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
    })
  );

  return `${header}.${payload}.${btoa(JWT_SECRET)}`;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  await connectToDatabase();
  const users = getCollection('users');
  const user = await users.findOne({ email });
  return user as AuthUser | null;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  await connectToDatabase();
  const users = getCollection('users');
  const user = await users.findOne({ _id: id });
  return user as AuthUser | null;
}

export async function createUser(userData: {
  email: string;
  name: string;
  password: string;
  role: 'patient' | 'therapist';
  age?: number;
  specialization?: string;
  experience?: string;
  hourlyRate?: number;
  licenseNumber?: string;
  phone?: string;
  bio?: string;
  emergencyContactEmail?: string;
  emergencyContactRelation?: string;
}): Promise<AuthUser> {
  await connectToDatabase();
  const users = getCollection('users');

  const existingUser = await users.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await hashPassword(userData.password);
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newUser: AuthUser = {
    id: userId,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    status: userData.role === 'therapist' ? 'pending' : undefined,
    verified: userData.role === 'patient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(userData.age && { age: userData.age }),
    ...(userData.specialization && { specialization: userData.specialization }),
    ...(userData.experience && { experience: userData.experience }),
    ...(userData.hourlyRate && { hourlyRate: userData.hourlyRate }),
    ...(userData.licenseNumber && { licenseNumber: userData.licenseNumber }),
    ...(userData.phone && { phone: userData.phone }),
    ...(userData.bio && { bio: userData.bio }),
    ...(userData.emergencyContactEmail && {
      emergencyContactEmail: userData.emergencyContactEmail
    }),
    ...(userData.emergencyContactRelation && {
      emergencyContactRelation: userData.emergencyContactRelation
    })
  };

  await users.insertOne({
    _id: userId,
    ...newUser,
    passwordHash: hashedPassword
  } as any);

  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<AuthUser>
): Promise<AuthUser | null> {
  await connectToDatabase();
  const users = getCollection('users');

  const result = await users.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    },
    { returnDocument: 'after' }
  );

  return result.value as AuthUser | null;
}

export async function seedDefaultUsers() {
  await connectToDatabase();
  const users = getCollection('users');

  const defaultUsers = [
    {
      id: 'patient',
      email: 'patient@example.com',
      name: 'John Doe',
      role: 'patient' as const,
      verified: true,
      age: 28,
      emergencyContactEmail: 'emergency@example.com',
      emergencyContactRelation: 'parent'
    },
    {
      id: 'therapist',
      email: 'therapist@example.com',
      name: 'Dr. Sarah Smith',
      role: 'therapist' as const,
      status: 'approved' as const,
      verified: true,
      specialization: 'Cognitive Behavioral Therapy',
      hourlyRate: 120,
      licenseNumber: 'LIC123456',
      experience: '8 years',
      phone: '+1 (555) 234-5678',
      bio: 'Experienced therapist specializing in CBT with a passion for helping patients overcome anxiety and depression.'
    },
    {
      id: 'admin',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as const,
      verified: true
    }
  ];

  for (const user of defaultUsers) {
    const exists = await users.findOne({ _id: user.id });
    if (!exists) {
      const hashedPassword = await hashPassword('password');
      await users.insertOne({
        _id: user.id,
        ...user,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);
    }
  }
}
