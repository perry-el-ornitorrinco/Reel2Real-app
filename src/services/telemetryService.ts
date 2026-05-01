import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export const appLaunchTime = Date.now();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function logTelemetry(ttrSeconds?: number) {
  if (!auth.currentUser) return;
  try {
    const finalTtr = ttrSeconds ?? ((Date.now() - appLaunchTime) / 1000);
    const isHighTtr = finalTtr > 180; // Over 3 minutes is high
    
    await addDoc(collection(db, 'analytics'), {
      timeToReality: finalTtr,
      lonelinessIndex: isHighTtr ? 0.8 : 0.2, // Simulated inference of indecision/loneliness (Ethics Cátedra Lamarr)
      simplifiedUI: isHighTtr, // Trigger simplified UI in next session if TTR was high
      timestamp: new Date().toISOString()
    });
    // Write simplifiedUI locally to simulate next session change
    if (isHighTtr) {
      localStorage.setItem('reel2real_simplified_ui', 'true');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'analytics');
  }
}
