import { auth, db, storage, googleProvider } from "./config";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
} from "firebase/firestore";

// Helper for auth user session compatibility
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser || (await getCurrentUser());
  if (!user) return null;
  return user.getIdToken();
};

export { auth, db, storage, googleProvider, firebaseSignOut };
