import { describe, expect, it } from "vitest";
import { buildMeCard, buildOnlineUrl, buildVCard, parseContactPayload } from "../lib/qr-codec";
import type { DigitalCard } from "../shared/card";

const card: DigitalCard = {
  id: "test-card",
  slug: "yasser-abu-alaa",
  name: "ياسر أبو علاء",
  jobTitle: "مطور برمجيات وتطبيقات أندرويد",
  company: "QR Card",
  bio: "بطاقة رقمية",
  phone: "+905353883886",
  email: "yasser@example.com",
  location: "تركيا",
  avatarUri: "",
  links: [{ id: "github", platform: "github", label: "GitHub", url: "https://github.com/abw3laa/Qr", visible: true }],
  updatedAt: new Date().toISOString(),
  syncStatus: "local",
};

describe("QR codec", () => {
  it("builds a vCard payload with contact fields", () => {
    const payload = buildVCard(card);
    expect(payload).toContain("BEGIN:VCARD");
    expect(payload).toContain("FN:ياسر أبو علاء");
    expect(payload).toContain("TEL;TYPE=CELL:+905353883886");
    expect(payload).toContain("URL;TYPE=GITHUB:https://github.com/abw3laa/Qr");
    expect(payload).toContain("END:VCARD");
  });

  it("builds and parses a MeCard payload offline", () => {
    const payload = buildMeCard(card);
    expect(payload.startsWith("MECARD:")).toBe(true);
    const parsed = parseContactPayload(payload);
    expect(parsed?.name).toBe(card.name);
    expect(parsed?.phone).toBe(card.phone);
    expect(parsed?.email).toBe(card.email);
  });

  it("parses a vCard payload offline", () => {
    const parsed = parseContactPayload(buildVCard(card));
    expect(parsed?.name).toBe(card.name);
    expect(parsed?.jobTitle).toBe(card.jobTitle);
  });

  it("creates a stable public URL from the card slug", () => {
    expect(buildOnlineUrl(card, "https://qr-card.example")).toBe("https://qr-card.example/c/yasser-abu-alaa");
  });
});
