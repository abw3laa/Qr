import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

export function getPublicWebBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  const apiBase = getApiBaseUrl();
  if (apiBase) {
    try {
      const parsed = new URL(apiBase);
      parsed.hostname = parsed.hostname.replace(/^3000-/, "8081-");
      return parsed.toString().replace(/\/$/, "");
    } catch {
      return "";
    }
  }
  return "";
}
