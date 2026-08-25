import { beforeEach, describe, expect, it, vi } from "vitest";

const memory = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => { memory.set(key, value); },
    removeItem: async (key: string) => { memory.delete(key); },
    multiRemove: async (keys: string[]) => { keys.forEach((key) => memory.delete(key)); },
  },
}));

import { clearLocalData, enqueueChange, getPendingChanges, loadLocalCard, saveLocalCard } from "../lib/offline-store";
import type { DigitalCard } from "../shared/card";

const card: DigitalCard = {
  id: "local-card",
  slug: "offline-card",
  name: "ياسر أبو علاء",
  jobTitle: "مطور",
  company: "",
  bio: "",
  phone: "+905353883886",
  email: "",
  location: "",
  avatarUri: "",
  links: [],
  updatedAt: new Date().toISOString(),
  syncStatus: "pending",
};

describe("offline card store", () => {
  beforeEach(() => memory.clear());

  it("persists a card and queues the latest pending change", async () => {
    await saveLocalCard(card);
    await enqueueChange(card);
    expect((await loadLocalCard())?.name).toBe(card.name);
    expect((await getPendingChanges())).toHaveLength(1);
  });

  it("clears local card and sync queue", async () => {
    await saveLocalCard(card);
    await enqueueChange(card);
    await clearLocalData();
    expect(await loadLocalCard()).toBeNull();
    expect(await getPendingChanges()).toEqual([]);
  });
});
