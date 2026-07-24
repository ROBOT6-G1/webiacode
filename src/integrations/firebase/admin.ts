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

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const ref = doc(db, "profiles", userId);
    await setDoc(ref, { id: userId, ...data }, { merge: true });
  },

  // Projects
  async getProject(projectId: string) {
    if (!projectId) return null;
    const snap = await getDoc(doc(db, "projects", projectId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updateProject(projectId: string, data: Record<string, unknown>) {
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
    try {
      await this.syncSystemKeyToFirestore();
    } catch (e) {
      console.warn("Failed syncing system key to Firestore:", e);
    }
    let keys: Array<{ id: string; active?: boolean; [key: string]: unknown }> = [];
    try {
      const q = query(collection(db, "admin_gemini_keys"), where("active", "==", true));
      const snap = await getDocs(q);
      keys = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("Query with active==true failed, trying full fetch:", err);
    }

    if (keys.length === 0) {
      try {
        const snapAll = await getDocs(collection(db, "admin_gemini_keys"));
        keys = snapAll.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((k) => k.active !== false);
      } catch (errAll) {
        console.warn("Full fetch failed:", errAll);
      }
    }

    const sysKey =
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_GEMINI_API_KEY as string)) ||
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (sysKey && !keys.some((k) => k.key_value === sysKey)) {
      keys.unshift({
        id: "sys_env_key",
        label: "Clé Système Gemini",
        provider: "google",
        key_value: sysKey,
        active: true,
      });
    }

    return keys;
  },

  async syncSystemKeyToFirestore() {
    const sysKey =
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_GEMINI_API_KEY as string)) ||
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!sysKey) return;

    try {
      const snap = await getDocs(collection(db, "admin_gemini_keys"));
      const docs = snap.docs.map((d) => d.data());
      const alreadyExists = docs.some((d) => d.key_value === sysKey);

      if (!alreadyExists) {
        await addDoc(collection(db, "admin_gemini_keys"), {
          label: "Clé Système Gemini (Auto-synchronisée)",
          provider: "google",
          key_value: sysKey,
          active: true,
          created_at: new Date().toISOString(),
          request_count: 0,
          tokens_used: 0,
        });
        console.log("System GEMINI_API_KEY successfully synced to Firestore database!");
      }
    } catch (err) {
      console.warn("Error auto-syncing Gemini key to Firestore:", err);
    }
  },

  async updateAdminKey(keyId: string, data: Record<string, unknown>) {
    if (!keyId) return;
    await setDoc(doc(db, "admin_gemini_keys", keyId), data, { merge: true });
  },

  // Payments
  async getPayment(paymentId: string) {
    if (!paymentId) return null;
    const snap = await getDoc(doc(db, "payments", paymentId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updatePayment(paymentId: string, data: Record<string, unknown>) {
    if (!paymentId) return;
    await setDoc(doc(db, "payments", paymentId), data, { merge: true });
  },

  // Messages
  async addMessage(msg: Record<string, unknown>) {
    const docRef = await addDoc(collection(db, "messages"), {
      ...msg,
      created_at: new Date().toISOString(),
    });
    return docRef.id;
  },

  async getMessages(projectId: string) {
    const q = query(
      collection(db, "messages"),
      where("project_id", "==", projectId),
      orderBy("created_at", "asc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // App Users & Quota check (200 user limit enforcement for Free plan)
  async getAppUsersCount(projectId: string) {
    const q = query(collection(db, "app_users"), where("projectId", "==", projectId));
    const snap = await getDocs(q);
    return snap.size;
  },
};
