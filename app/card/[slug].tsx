import { useMemo } from "react";
import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { saveCardToContacts } from "@/lib/contact";
import { trpc } from "@/lib/trpc";
import { getPublicWebBaseUrl } from "@/lib/public-url";

const FALLBACK_CARD = {
  name: "بطاقة QR Card",
  jobTitle: "بطاقة رقمية قابلة للتحديث",
  company: "",
  bio: "افتح هذه الصفحة من رمز QR الأونلاين لرؤية بيانات البطاقة.",
  phone: "",
  email: "",
  location: "",
  avatarUrl: "",
  links: [] as { label: string; url: string; platform: string; isVisible?: boolean }[],
};

export default function PublicCardScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = trpc.cards.getBySlug.useQuery({ slug: String(slug ?? "") }, { enabled: Boolean(slug), retry: false });
  const card = query.data ?? FALLBACK_CARD;
  const initials = useMemo(() => card.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "QR", [card.name]);
  const publicUrl = `${getPublicWebBaseUrl()}/c/${slug ?? "my-card"}`;
  const phone = card.phone ?? "";

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert("تعذر فتح الرابط", "تحقق من اتصال الجهاز وحاول مرة أخرى."));
  const share = async () => { await Share.share({ message: `بطاقة ${card.name}: ${publicUrl}`, url: publicUrl }); };
  const saveContact = async () => {
    const result = await saveCardToContacts({ name: card.name, phone: card.phone ?? "", email: card.email ?? "", company: card.company ?? "", jobTitle: card.jobTitle ?? "" });
    if (result === "saved") Alert.alert("تم الحفظ", "أُضيفت البطاقة إلى جهات الاتصال.");
    else if (result === "unsupported") Alert.alert("حفظ جهة الاتصال", "استخدم زر المشاركة أو افتح البطاقة على تطبيق Android لحفظها.");
    else Alert.alert("الصلاحية مطلوبة", "اسمح للتطبيق بالوصول إلى جهات الاتصال حتى يتم الحفظ.");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" safeAreaClassName="bg-background">
      <View style={styles.page}>
        <View style={styles.top}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Text style={styles.backText}>رجوع</Text></Pressable><Text style={styles.brand}>QR CARD</Text></View>
        <View style={styles.card}>
          <View style={styles.glow} />
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.role}>{card.jobTitle}{card.company ? ` · ${card.company}` : ""}</Text>
          {card.location ? <Text style={styles.location}>{card.location}</Text> : null}
          <Text style={styles.bio}>{card.bio}</Text>
          <View style={styles.actions}>
            {phone ? <Pressable onPress={() => open(`tel:${phone}`)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionIcon}>☎</Text><Text style={styles.actionText}>اتصال</Text></Pressable> : null}
            {phone ? <Pressable onPress={() => open(`https://wa.me/${phone.replace(/\D/g, "")}`)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionIcon}>◉</Text><Text style={styles.actionText}>واتساب</Text></Pressable> : null}
            <Pressable onPress={share} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionIcon}>↗</Text><Text style={styles.actionText}>مشاركة</Text></Pressable>
          </View>
          <Pressable onPress={saveContact} style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}><Text style={styles.saveText}>＋ حفظ جهة الاتصال</Text></Pressable>
        </View>
        <View style={styles.linksBox}>
          <Text style={styles.linksTitle}>روابط التواصل</Text>
          {card.links?.filter((link) => link.isVisible !== false).map((link) => <Pressable key={link.url} onPress={() => open(link.url)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={styles.linkArrow}>↗</Text><Text style={styles.linkLabel}>{link.label}</Text></Pressable>)}
          {!card.links?.length ? <Text style={styles.emptyLinks}>ستظهر روابط التواصل هنا بعد نشر البطاقة.</Text> : null}
        </View>
        {query.isLoading ? <Text style={styles.notice}>جاري تحميل بيانات البطاقة…</Text> : null}
        {query.isError ? <Text style={styles.notice}>هذه معاينة محلية. عند نشر البطاقة ستظهر بياناتها من السيرفر.</Text> : null}
        <Text style={styles.footer}>بطاقة رقمية تُشارك عبر QR وNFC</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20, gap: 16, maxWidth: 620, width: "100%", alignSelf: "center" },
  top: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  brand: { color: "#22D3C5", fontSize: 12, letterSpacing: 2, fontWeight: "800" },
  back: { backgroundColor: "#17213A", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  backText: { color: "#CBD5E1", fontSize: 12, fontWeight: "700" },
  card: { overflow: "hidden", alignItems: "center", borderRadius: 30, padding: 28, backgroundColor: "#111A31", borderWidth: 1, borderColor: "#263454" },
  glow: { position: "absolute", width: 260, height: 180, borderRadius: 200, backgroundColor: "#243E88", opacity: 0.55, top: -95, left: -70 },
  avatar: { width: 88, height: 88, borderRadius: 30, backgroundColor: "#22D3C5", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  avatarText: { color: "#0B1020", fontSize: 30, fontWeight: "900" },
  name: { color: "#FFFFFF", fontSize: 26, fontWeight: "900", textAlign: "center" },
  role: { color: "#A5B4FC", fontSize: 14, textAlign: "center", marginTop: 5 },
  location: { color: "#94A3B8", fontSize: 12, textAlign: "center", marginTop: 6 },
  bio: { color: "#CBD5E1", lineHeight: 21, fontSize: 13, textAlign: "center", marginTop: 14, maxWidth: 360 },
  actions: { flexDirection: "row-reverse", gap: 8, marginTop: 22 },
  action: { flexDirection: "row-reverse", alignItems: "center", gap: 6, borderRadius: 100, backgroundColor: "#1B2947", paddingVertical: 10, paddingHorizontal: 13 },
  actionIcon: { color: "#22D3C5", fontSize: 14 },
  actionText: { color: "#E2E8F0", fontSize: 11, fontWeight: "800" },
  saveButton: { minHeight: 50, width: "100%", borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 18, backgroundColor: "#22D3C5" },
  saveText: { color: "#0B1020", fontSize: 14, fontWeight: "900" },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  linksBox: { backgroundColor: "#111827", borderRadius: 22, borderWidth: 1, borderColor: "#1F2A44", padding: 18 },
  linksTitle: { color: "#F8FAFC", fontSize: 15, fontWeight: "800", textAlign: "right", marginBottom: 8 },
  link: { minHeight: 48, borderTopWidth: 1, borderTopColor: "#1F2A44", flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  linkLabel: { color: "#CBD5E1", fontSize: 13, fontWeight: "700" },
  linkArrow: { color: "#22D3C5", fontSize: 18 },
  emptyLinks: { color: "#64748B", fontSize: 12, textAlign: "right", paddingVertical: 12 },
  notice: { color: "#FBBF24", fontSize: 11, textAlign: "center" },
  footer: { color: "#475569", fontSize: 11, textAlign: "center", marginTop: "auto" },
  pressed: { opacity: 0.7 },
});
