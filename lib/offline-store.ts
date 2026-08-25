import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DigitalCard } from "@/shared/card";

const CARD_KEY = "qr-card:primary-card";
const QUEUE_KEY = "qr-card:sync-queue";

export type PendingChange = {
  id: string;
  card: DigitalCard;
  createdAt: string;
};

export async function loadLocalCard(): Promise<DigitalCard | null> {
  const value = await AsyncStorage.getItem(CARD_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as DigitalCard;
  } catch {
    return null;
  }
}

export async function saveLocalCard(card: DigitalCard): Promise<void> {
  await AsyncStorage.setItem(CARD_KEY, JSON.stringify(card));
}

export async function enqueueChange(card: DigitalCard): Promise<void> {
  const existing = await getPendingChanges();
  const next = existing.filter((item) => item.card.id !== card.id);
  next.push({ id: `${card.id}-${Date.now()}`, card, createdAt: new Date().toISOString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
}

export async function getPendingChanges(): Promise<PendingChange[]> {
  const value = await AsyncStorage.getItem(QUEUE_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as PendingChange[]) : [];
  } catch {
    return [];
  }
}

export async function clearPendingChanges(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function clearLocalData(): Promise<void> {
  await AsyncStorage.multiRemove([CARD_KEY, QUEUE_KEY]);
}
