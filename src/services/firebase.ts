/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized Firebase services: Auth, Firestore, and Storage with automatic
 * profile seeding and offline/localStorage fallback.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const STORAGE_KEY_PREFIX = 'kaitana_profile_';

/** Safely persists a profile snapshot in localStorage as an instant offline cache. */
export const saveLocalProfileCache = (profileId: string, data: any) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${profileId}`, JSON.stringify(data));
  } catch {
    try {
      if (data?.images) {
        const lightweight = {
          ...data,
          images: data.images.map((img: any) => ({
            ...img,
            url: img.url?.length > 1000 && img.url.startsWith('data:') ? img.url.slice(0, 100) : img.url
          }))
        };
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${profileId}`, JSON.stringify(lightweight));
      }
    } catch {
      /* ignore quota errors */
    }
  }
};

/** Loads a profile from localStorage cache or falls back to the initial seed. */
export const loadLocalProfileCache = (profileId: string, fallback: any) => {
  try {
    const raw =
      localStorage.getItem(`${STORAGE_KEY_PREFIX}${profileId}`) ||
      localStorage.getItem(`kaitana_${profileId}_state`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed.user?.name === 'Owner Profile') parsed.user.name = 'Malachai Uys';
    if (!parsed.images?.length) parsed.images = fallback.images;
    if (!parsed.selections?.length) parsed.selections = fallback.selections;
    if (!parsed.journal) parsed.journal = fallback.journal;
    return parsed;
  } catch {
    return fallback;
  }
};

/**
 * Subscribes to `profiles/{profileId}` in Firestore.
 * Automatically seeds Firestore with local/demo data if the document does not exist yet.
 */
export const subscribeToProfile = (
  profileId: string,
  seedData: any,
  onUpdate: (data: any) => void
): Unsubscribe => {
  const refDoc = doc(db, 'profiles', profileId);
  return onSnapshot(
    refDoc,
    (snap) => {
      if (snap.exists()) {
        const remote = snap.data();
        const merged = {
          ...seedData,
          ...remote,
          images: remote.images?.length ? remote.images : seedData.images,
          selections: remote.selections?.length ? remote.selections : seedData.selections,
          journal: remote.journal || seedData.journal
        };
        saveLocalProfileCache(profileId, merged);
        onUpdate(merged);
      } else {
        // Seed Firestore once with the initial local/demo profile
        const initial = loadLocalProfileCache(profileId, seedData);
        setDoc(refDoc, initial, { merge: true }).catch(() => {
          /* Firestore offline or rules restricted — local cache remains active */
        });
      }
    },
    () => {
      /* Snapshot listener permission/network fallback — local cache remains active */
    }
  );
};

/** Writes a full or partial profile state to both local cache and Firestore. */
export const persistProfileState = (profileId: string, state: any) => {
  saveLocalProfileCache(profileId, state);
  const refDoc = doc(db, 'profiles', profileId);
  setDoc(refDoc, state, { merge: true }).catch(() => {
    /* Offline or rules fallback — kept in local cache */
  });
};

/**
 * Uploads a media file directly to Firebase Storage (`media/{profileId}/{timestamp}_{name}`)
 * and returns its public download URL. Throws if Storage is unreachable so caller can fall back.
 */
export const uploadMediaToFirebase = async (profileId: string, file: File): Promise<string> => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `media/${profileId}/${Date.now()}_${safeName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};
