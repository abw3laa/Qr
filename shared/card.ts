export type SocialPlatform =
  | "linkedin"
  | "instagram"
  | "x"
  | "facebook"
  | "github"
  | "website"
  | "telegram"
  | "whatsapp";

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  visible: boolean;
};

export type DigitalCard = {
  id: string;
  serverId?: number;
  slug: string;
  name: string;
  jobTitle: string;
  company: string;
  bio: string;
  phone: string;
  email: string;
  location: string;
  avatarUri: string;
  links: SocialLink[];
  updatedAt: string;
  syncStatus: "local" | "synced" | "pending";
};

export const SOCIAL_OPTIONS: Array<{ platform: SocialPlatform; label: string; placeholder: string }> = [
  { platform: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { platform: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { platform: "x", label: "X", placeholder: "https://x.com/..." },
  { platform: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { platform: "github", label: "GitHub", placeholder: "https://github.com/..." },
  { platform: "website", label: "موقعك الإلكتروني", placeholder: "https://..." },
  { platform: "telegram", label: "Telegram", placeholder: "https://t.me/..." },
  { platform: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/..." },
];

export const EMPTY_CARD: DigitalCard = {
  id: "local-card",
  slug: "my-card",
  name: "",
  jobTitle: "",
  company: "",
  bio: "",
  phone: "",
  email: "",
  location: "",
  avatarUri: "",
  links: [],
  updatedAt: new Date(0).toISOString(),
  syncStatus: "local",
};

export function createLink(platform: SocialPlatform = "linkedin"): SocialLink {
  const option = SOCIAL_OPTIONS.find((item) => item.platform === platform) ?? SOCIAL_OPTIONS[0];
  return {
    id: `${platform}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    platform,
    label: option.label,
    url: "",
    visible: true,
  };
}

export function cardHasContent(card: DigitalCard): boolean {
  return Boolean(card.name.trim() || card.phone.trim() || card.email.trim() || card.links.some((link) => link.url.trim()));
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "QR";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
