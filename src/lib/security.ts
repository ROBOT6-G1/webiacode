import { db } from "@/integrations/firebase/config";
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
  arrayUnion,
} from "firebase/firestore";

export interface DeviceLocation {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: string;
  status: "granted" | "denied" | "unavailable" | "timeout";
}

export interface DeviceInfo {
  deviceId: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timeZone: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  vendor: string;
}

/**
 * Retrieves or generates a persistent device ID for anti-multi-account tracking.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server-side";
  let id = localStorage.getItem("devwebia_device_id");
  if (!id) {
    id = "DEV-" + crypto.randomUUID().toUpperCase();
    localStorage.setItem("devwebia_device_id", id);
  }
  return id;
}

/**
 * Collects technical device and browser specifications.
 */
export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      deviceId: "unknown",
      userAgent: "unknown",
      platform: "unknown",
      language: "unknown",
      screenResolution: "0x0",
      timeZone: "UTC",
      hardwareConcurrency: 1,
      vendor: "unknown",
    };
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    deviceId: getDeviceId(),
    userAgent: nav.userAgent || "Unknown",
    platform: nav.platform || "Unknown",
    language: nav.language || "Unknown",
    screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    hardwareConcurrency: nav.hardwareConcurrency || 1,
    deviceMemory: nav.deviceMemory,
    vendor: nav.vendor || "Unknown",
  };
}

/**
 * Gets user geolocation position safely with a 5s timeout.
 */
export async function getDeviceLocation(): Promise<DeviceLocation> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return { status: "unavailable" };
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({ status: "timeout" });
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date(pos.timestamp).toISOString(),
          status: "granted",
        });
      },
      (err) => {
        clearTimeout(timeoutId);
        resolve({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        });
      },
      { enableHighAccuracy: true, timeout: 4500, maximumAge: 300000 },
    );
  });
}

/**
 * Firebase Anti-Multi-Account Enforcer:
 * Detects if a phone/device has registered or used another account previously.
 * If detected, suspends the previous account and activates the new account.
 */
export async function enforceDeviceSecurity(
  userId: string,
  userEmail: string,
): Promise<{ isSuspended: boolean; reason?: string }> {
  try {
    const deviceId = getDeviceId();
    const deviceInfo = collectDeviceInfo();
    const locationData = await getDeviceLocation();

    // 1. Check if the current user profile is already suspended
    const myProfRef = doc(db, "profiles", userId);
    const mySnap = await getDoc(myProfRef);
    if (mySnap.exists()) {
      const myData = mySnap.data();
      if (myData?.status === "suspended" || myData?.is_suspended === true) {
        return {
          isSuspended: true,
          reason:
            myData?.suspension_reason ||
            "Compte suspendu pour détection de multi-compte sur cet appareil.",
        };
      }
    }

    // 2. Query all existing profiles associated with this deviceId
    const profilesQuery = query(collection(db, "profiles"), where("device_id", "==", deviceId));
    const existingDeviceProfilesSnap = await getDocs(profilesQuery);

    const suspendedAccounts: string[] = [];

    // 3. Suspend any previously existing active account on this same device
    for (const docSnap of existingDeviceProfilesSnap.docs) {
      const oldUid = docSnap.id;
      const oldData = docSnap.data();

      if (oldUid !== userId) {
        // Old account detected on the same device!
        if (oldData.status !== "suspended") {
          await updateDoc(doc(db, "profiles", oldUid), {
            status: "suspended",
            is_suspended: true,
            suspended_at: new Date().toISOString(),
            suspension_reason: `Suspendu automatiquement par Firebase Security : Nouveau compte (${userEmail}) créé ou utilisé sur cet appareil.`,
            replaced_by_user_id: userId,
          });

          suspendedAccounts.push(oldData.email || oldUid);

          // Log security breach
          await addDoc(collection(db, "security_logs"), {
            event: "multi_account_suspended_previous",
            device_id: deviceId,
            active_user_id: userId,
            active_user_email: userEmail,
            suspended_user_id: oldUid,
            suspended_user_email: oldData.email || "",
            location: locationData,
            device_info: deviceInfo,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Update or initialize current profile with device & location details
    await setDoc(
      myProfRef,
      {
        device_id: deviceId,
        device_info: deviceInfo,
        last_location: locationData,
        status: "active",
        is_suspended: false,
        last_login_at: new Date().toISOString(),
      },
      { merge: true },
    );

    // 5. Update devices collection record
    const deviceRef = doc(db, "devices", deviceId);
    await setDoc(
      deviceRef,
      {
        device_id: deviceId,
        active_user_id: userId,
        active_user_email: userEmail,
        all_user_ids: arrayUnion(userId),
        last_location: locationData,
        device_info: deviceInfo,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );

    return { isSuspended: false };
  } catch (err) {
    console.warn("Notice enforceDeviceSecurity:", err);
    return { isSuspended: false };
  }
}
