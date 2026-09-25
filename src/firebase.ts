import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App safely (singleton pattern)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with custom database ID as provisioned
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection test to validate Firestore connectivity
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  department: string;
  officer: string;
  ceiling: number;
  annualAllocation: number;
  projectedSpend: number;
  actualSpend: number;
  physicalProgress: number;
  status: string;
  startDate: string;
  endDate: string;
  year?: number;
  issues: string;
  remarks: string;
  files?: Array<{ name: string; size: string; type: string }>;
  logs?: Array<{ date: string; officer: string; action: string }>;
  updatedAt?: any;
  updatedBy?: string;
}

export interface SubmissionRecord {
  id?: string;
  submissionType: 'CREATE_PROJECT' | 'UPDATE_PROJECT' | 'VERIFICATION_APPROVAL' | 'STATUS_UPDATE' | 'GEMINI_AGENT_QUERY';
  projectId: string;
  title: string;
  data: Record<string, any>;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: any;
  formattedTime?: string;
}

/**
 * Record a submission with server timestamp into Firestore
 */
export async function recordSubmission(
  submissionType: SubmissionRecord['submissionType'],
  projectId: string,
  title: string,
  data: Record<string, any>,
  currentUser: User | null
): Promise<string> {
  try {
    const submissionsCol = collection(db, 'submissions');
    const docRef = await addDoc(submissionsCol, {
      submissionType,
      projectId: projectId || 'N/A',
      title: title || 'Penyerahan Data',
      data: data || {},
      userId: currentUser?.uid || 'anonymous',
      userEmail: currentUser?.email || 'tiada-emel@kpsti.gov.my',
      userName: currentUser?.displayName || 'Pegawai KPSTI',
      timestamp: serverTimestamp()
    });
    console.log('[Firestore] Submission recorded successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Firestore] Error recording submission:', error);
    handleFirestoreError(error, OperationType.CREATE, 'submissions');
  }
}

/**
 * Save or update a project document in Firestore and log a submission record
 */
export async function saveProjectToFirestore(
  project: ProjectData,
  currentUser: User | null,
  isNew: boolean
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', project.id);
    const payload = {
      ...project,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.displayName || currentUser?.email || 'Pegawai KPSTI',
      lastModifiedByUid: currentUser?.uid || 'system'
    };

    await setDoc(projectRef, payload, { merge: true });

    // Store every submission with server timestamp in submissions collection
    const alloc = Number(project.annualAllocation) || 0;
    const actual = Number(project.actualSpend) || 0;
    const variance = alloc - actual;
    const utilRate = alloc > 0 ? Number(((actual / alloc) * 100).toFixed(1)) : 0;
    const balanceStatus = variance >= 0 ? "Baki Peruntukan Positif" : "Lebihan Belanja (Defisit)";

    await recordSubmission(
      isNew ? 'CREATE_PROJECT' : 'UPDATE_PROJECT',
      project.id,
      project.title,
      {
        // Inputs supplied in cycle
        inputs: {
          code: project.id,
          title: project.title,
          description: project.description,
          department: project.department,
          officer: project.officer,
          ceiling: project.ceiling,
          annualAllocation: project.annualAllocation,
          actualSpend: project.actualSpend,
          projectedSpend: project.projectedSpend,
          status: project.status,
          physicalProgress: project.physicalProgress,
          startDate: project.startDate,
          endDate: project.endDate,
          issues: project.issues,
          remarks: project.remarks,
          filesCount: (project.files || []).length,
          files: (project.files || []).map(f => ({ name: f.name, size: f.size, type: f.type }))
        },
        // Outputs computed from cycle
        outputs: {
          expenditureVarianceRM: variance,
          utilizationPercentage: utilRate,
          balanceStatus,
          burnRateStatus: utilRate > 100 ? "Kritikal (Melebihi Had)" : utilRate >= 75 ? "Tinggi / Pantas" : "Sederhana / Dalam Sasaran",
          milestoneProgressGap: (project.physicalProgress || 0) - utilRate
        },
        // Direct fields for backward compatibility
        annualAllocation: project.annualAllocation,
        actualSpend: project.actualSpend,
        physicalProgress: project.physicalProgress,
        status: project.status,
        department: project.department,
        officer: project.officer
      },
      currentUser
    );
  } catch (error) {
    console.error('[Firestore] Error saving project to Firestore:', error);
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `projects/${project.id}`);
  }
}

/**
 * Real-time listener for projects in Firestore
 */
export function subscribeToProjects(
  onUpdate: (projects: ProjectData[]) => void,
  onError?: (err: Error) => void
) {
  const pathForOnSnapshot = 'projects';
  const projectsCol = collection(db, pathForOnSnapshot);
  return onSnapshot(
    projectsCol,
    (snapshot) => {
      const projects: ProjectData[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as ProjectData;
        projects.push({ ...d, id: docSnap.id });
      });
      onUpdate(projects);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
    }
  );
}

/**
 * Real-time listener for all submissions in Firestore
 */
export function subscribeToSubmissions(
  onUpdate: (submissions: SubmissionRecord[]) => void,
  onError?: (err: Error) => void
) {
  const pathForOnSnapshot = 'submissions';
  const submissionsCol = collection(db, pathForOnSnapshot);
  const q = query(submissionsCol, orderBy('timestamp', 'desc'), limit(50));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const records: SubmissionRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let formattedTime = 'Baru sahaja';
        if (data.timestamp instanceof Timestamp) {
          formattedTime = data.timestamp.toDate().toLocaleString('ms-MY', {
            dateStyle: 'medium',
            timeStyle: 'medium'
          });
        }
        records.push({
          id: docSnap.id,
          submissionType: data.submissionType,
          projectId: data.projectId,
          title: data.title,
          data: data.data || {},
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          timestamp: data.timestamp,
          formattedTime
        });
      });
      onUpdate(records);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
    }
  );
}

/**
 * Delete a project document from Firestore and log a submission record
 */
export async function deleteProjectFromFirestore(
  projectId: string,
  projectTitle: string,
  currentUser: User | null
): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await setDoc(projectRef, { status: 'Dipadamkan', isDeleted: true, updatedAt: serverTimestamp() }, { merge: true });

    // Store deletion submission record with timestamp
    await recordSubmission(
      'STATUS_UPDATE',
      projectId,
      `Pemadaman Rekod Projek: ${projectTitle}`,
      { action: 'DELETE_PROJECT', projectId },
      currentUser
    );
  } catch (error) {
    console.error('[Firestore] Error deleting project from Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
  }
}

/**
 * Sign in with Google using popup with redirect fallback
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[Auth] Google Sign-In successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('[Auth] Google Sign-In error:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('[Auth] User signed out');
  } catch (error) {
    console.error('[Auth] Error signing out:', error);
    throw error;
  }
}

/**
 * Seeds initial projects if Firestore collection is empty
 */
export async function seedInitialProjectsIfEmpty(initialProjects: ProjectData[]): Promise<boolean> {
  try {
    const projectsCol = collection(db, 'projects');
    const snapshot = await getDocs(projectsCol);
    if (snapshot.empty) {
      console.log('[Firestore] Seeding initial government projects into Firestore...');
      for (const prj of initialProjects) {
        await setDoc(doc(db, 'projects', prj.id), {
          ...prj,
          updatedAt: serverTimestamp(),
          updatedBy: 'Sistem e-Pantau (Inisialisasi Rasmi)'
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[Firestore] Note on seeding projects:', error);
    return false;
  }
}

/**
 * Ping live Firestore server using getDocs / server round-trip to validate live connectivity
 */
export async function pingFirestoreConnection(): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    const projectsCol = collection(db, 'projects');
    const q = query(projectsCol, limit(1));
    await getDocs(q);
    const latencyMs = Math.max(1, Math.round(performance.now() - start));
    return { success: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return { success: false, latencyMs, error: err?.message || String(err) };
  }
}


