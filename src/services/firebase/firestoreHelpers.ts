import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firestore';

let permissionWarningLogged = false;

const logPermissionWarning = (path: string) => {
  if (!permissionWarningLogged) {
    permissionWarningLogged = true;
    console.info(
      `ℹ️ Firestore Security Rules Notice (${path}):\n` +
      `Your Firebase Console security rules are blocking unauthenticated reads/writes.\n` +
      `To fix: Go to Firebase Console -> Firestore Database -> Rules, and set rules to allow read, write: if true; for test mode.`
    );
  }
};

export const syncCollection = <T extends { id: string }>(
  collectionPath: string,
  onUpdate: (items: T[]) => void
) => {
  const colRef = collection(db, collectionPath);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as T),
        id: docSnap.id,
      }));
      onUpdate(items);
    },
    (error) => {
      if (error.code === 'permission-denied') {
        logPermissionWarning(collectionPath);
      } else {
        console.warn(`Firestore sync error (${collectionPath}):`, error.message);
      }
    }
  );
};

export const saveDocument = async <T extends { id: string }>(
  collectionPath: string,
  item: T
) => {
  try {
    const docRef = doc(db, collectionPath, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      logPermissionWarning(collectionPath);
    } else {
      console.warn(`Firestore save error (${collectionPath}):`, error);
    }
  }
};

export const deleteDocument = async (collectionPath: string, id: string) => {
  try {
    const docRef = doc(db, collectionPath, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      logPermissionWarning(collectionPath);
    } else {
      console.warn(`Firestore delete error (${collectionPath}):`, error);
    }
  }
};
