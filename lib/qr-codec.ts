import type { DigitalCard } from "@/shared/card";

export type OfflineFormat = "vcard" | "mecard";

function clean(value: string): string {
  return value.replace(/[\\;,:]/g, " ").replace(/\r?\n/g, " ").trim();
}

export function buildVCard(card: DigitalCard): string {
  const visibleLinks = card.links.filter((link) => link.visible && link.url.trim());
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${clean(card.name)}`,
    card.company ? `ORG:${clean(card.company)}` : "",
    card.jobTitle ? `TITLE:${clean(card.jobTitle)}` : "",
    card.phone ? `TEL;TYPE=CELL:${clean(card.phone)}` : "",
    card.email ? `EMAIL:${clean(card.email)}` : "",
    card.location ? `ADR:;;${clean(card.location)}` : "",
    ...visibleLinks.map((link) => `URL;TYPE=${clean(link.label).toUpperCase()}:${link.url.trim()}`),
    card.bio ? `NOTE:${clean(card.bio)}` : "",
    "END:VCARD",
  ];
  return lines.filter(Boolean).join("\n");
}

export function buildMeCard(card: DigitalCard): string {
  const fields = [
    ["N", clean(card.name)],
    ["ORG", clean(card.company)],
    ["TEL", clean(card.phone)],
    ["EMAIL", clean(card.email)],
    ["ADR", clean(card.location)],
    ["NOTE", clean(card.bio)],
  ].filter(([, value]) => value);
  return `MECARD:${fields.map(([key, value]) => `${key}:${value}`).join(";")};;`;
}

export function buildOfflinePayload(card: DigitalCard, format: OfflineFormat): string {
  return format === "vcard" ? buildVCard(card) : buildMeCard(card);
}

export function buildOnlineUrl(card: DigitalCard, baseUrl = "https://qr-card.example"): string {
  return `${baseUrl.replace(/\/$/, "")}/c/${encodeURIComponent(card.slug)}`;
}

function parseFields(payload: string): Record<string, string> {
  return payload.split(";").reduce<Record<string, string>>((acc, item) => {
    const divider = item.indexOf(":");
    if (divider > 0) acc[item.slice(0, divider).toUpperCase()] = item.slice(divider + 1);
    return acc;
  }, {});
}

export function parseContactPayload(payload: string): Partial<DigitalCard> | null {
  const normalized = payload.trim();
  if (normalized.toUpperCase().startsWith("MECARD:")) {
    const fields = parseFields(normalized.slice(7).replace(/;;$/, ""));
    return {
      name: fields.N ?? "",
      company: fields.ORG ?? "",
      phone: fields.TEL ?? "",
      email: fields.EMAIL ?? "",
      location: fields.ADR ?? "",
      bio: fields.NOTE ?? "",
    };
  }
  if (normalized.toUpperCase().includes("BEGIN:VCARD")) {
    const fields = normalized.split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
      const divider = line.indexOf(":");
      if (divider > 0) acc[line.slice(0, divider).toUpperCase()] = line.slice(divider + 1);
      return acc;
    }, {});
    return {
      name: fields.FN ?? "",
      company: fields.ORG ?? "",
      jobTitle: fields.TITLE ?? "",
      phone: fields.TEL?.split(":").pop() ?? "",
      email: fields.EMAIL ?? "",
      location: fields.ADR?.split(";").filter(Boolean).pop() ?? "",
      bio: fields.NOTE ?? "",
    };
  }
  return null;
}

export function isOnlineCardUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+\/c\/[a-z0-9-]+$/i.test(value.trim());
}
