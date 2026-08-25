import type { DigitalCard } from "@/shared/card";

export function toApiCardInput(card: DigitalCard) {
  return {
    publicSlug: card.slug,
    name: card.name.trim(),
    jobTitle: card.jobTitle.trim() || null,
    company: card.company.trim() || null,
    bio: card.bio.trim() || null,
    phone: card.phone.trim() || null,
    email: card.email.trim() || null,
    location: card.location.trim() || null,
    avatarUrl: card.avatarUri.trim() || null,
    theme: null,
    isPublished: true,
    links: card.links.filter((link) => link.visible && link.url.trim()).map((link, index) => ({
      platform: link.platform,
      label: link.label,
      url: link.url.trim(),
      sortOrder: index,
      isVisible: true,
    })),
  };
}

export function fromApiCard(data: { id: number; publicSlug: string; name: string; jobTitle?: string | null; company?: string | null; bio?: string | null; phone?: string | null; email?: string | null; location?: string | null; avatarUrl?: string | null; updatedAt: Date | string; links?: Array<{ id?: number; platform: string; label: string; url: string; isVisible?: boolean }> }): DigitalCard {
  return {
    id: `server-${data.id}`,
    serverId: data.id,
    slug: data.publicSlug,
    name: data.name,
    jobTitle: data.jobTitle ?? "",
    company: data.company ?? "",
    bio: data.bio ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    location: data.location ?? "",
    avatarUri: data.avatarUrl ?? "",
    links: (data.links ?? []).map((link, index) => ({ id: String(link.id ?? index), platform: link.platform as DigitalCard["links"][number]["platform"], label: link.label, url: link.url, visible: link.isVisible !== false })),
    updatedAt: new Date(data.updatedAt).toISOString(),
    syncStatus: "synced",
  };
}
