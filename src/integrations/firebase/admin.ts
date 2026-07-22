import { db } from "./config";
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
  limit as limitQuery,
} from "firebase/firestore";

export const adminDb = {
  // Profiles
  async getProfile(userId: string) {
    const snap = await getDoc(doc(db, "profiles", userId));
    return snap.exists() ? snap.data() : null;
  },

  async updateProfile(userId: string, data: Record<string, any>) {
    const ref = doc(db, "profiles", userId);
    await setDoc(ref, { id: userId, ...data }, { merge: true });
  },

  // Projects
  async getProject(projectId: string) {
    if (!projectId) return null;
    const snap = await getDoc(doc(db, "projects", projectId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updateProject(projectId: string, data: Record<string, any>) {
    if (!projectId) return;
    const ref = doc(db, "projects", projectId);
    await setDoc(ref, { id: projectId, ...data }, { merge: true });
  },

  // User Integrations
  async getUserIntegrations(userId: string) {
    if (!userId) return null;
    const snap = await getDoc(doc(db, "user_integrations", userId));
    return snap.exists() ? snap.data() : null;
  },

  // Admin Keys
  async getAdminKeys() {
    const q = query(collection(db, "admin_gemini_keys"), where("active", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async updateAdminKey(keyId: string, data: Record<string, any>) {
    if (!keyId) return;
    await setDoc(doc(db, "admin_gemini_keys", keyId), data, { merge: true });
  },

  // Payments
  async getPayment(paymentId: string) {
    if (!paymentId) return null;
    const snap = await getDoc(doc(db, "payments", paymentId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updatePayment(paymentId: string, data: Record<string, any>) {
    if (!paymentId) return;
    await setDoc(doc(db, "payments", paymentId), data, { merge: true });
  },

  // Messages
  async addMessage(msg: Record<string, any>) {
    const docRef = await addDoc(collection(db, "messages"), {
      ...msg,
      created_at: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getMessages(projectId: string) {
    const q = query(collection(db, "messages"), where("project_id", "==", projectId), orderBy("created_at", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // App Users & Quota check (200 user limit enforcement for Free plan)
  async getAppUsersCount(projectId: string) {
    const q = query(collection(db, "app_users"), where("projectId", "==", projectId));
    const snap = await getDocs(q);
    return snap.size;
  }
};
