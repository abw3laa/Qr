import { describe, expect, it } from "vitest";
import { toApiCardInput } from "../lib/sync";
import type { DigitalCard } from "../shared/card";

const localCard: DigitalCard = {
  id: "local-card",
  slug: "yasser-abu-alaa",
  name: " ياسر أبو علاء ",
  jobTitle: "مطور",
  company: "",
  bio: "نبذة",
  phone: "+905353883886",
  email: "yasser@example.com",
  location: "تركيا",
  avatarUri: "",
  links: [{ id: "1", platform: "github", label: "GitHub", url: "https://github.com/abw3laa/Qr", visible: true }],
  updatedAt: new Date().toISOString(),
  syncStatus: "pending",
};

describe("sync mapping", () => {
  it("maps local card fields to the shared API contract", () => {
    const payload = toApiCardInput(localCard);
    expect(payload.name).toBe("ياسر أبو علاء");
    expect(payload.company).toBeNull();
    expect(payload.links).toEqual([{ platform: "github", label: "GitHub", url: "https://github.com/abw3laa/Qr", sortOrder: 0, isVisible: true }]);
    expect(payload.isPublished).toBe(true);
  });
});
