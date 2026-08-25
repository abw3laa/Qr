import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useRouter } from "expo-router";
import * as Network from "expo-network";

import { ScreenContainer } from "@/components/screen-container";
import { createLink, EMPTY_CARD, getInitials, SOCIAL_OPTIONS, type DigitalCard } from "@/shared/card";
import { buildMeCard, buildOnlineUrl, buildVCard, type OfflineFormat } from "@/lib/qr-codec";
import { clearPendingChanges, enqueueChange, getPendingChanges, loadLocalCard, saveLocalCard } from "@/lib/offline-store";
import { fromApiCard, toApiCardInput } from "@/lib/sync";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { getPublicWebBaseUrl } from "@/lib/public-url";

type QrMode = OfflineFormat | "online";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "url";
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.textarea]}
        textAlign="right"
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [card, setCard] = useState<DigitalCard>(EMPTY_CARD);
  const [qrMode, setQrMode] = useState<QrMode>("online");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { isAuthenticated } = useAuth();
  const network = Network.useNetworkState();
  const createCardMutation = trpc.cards.create.useMutation();
  const updateCardMutation = trpc.cards.update.useMutation();

  useEffect(() => {
    loadLocalCard().then((localCard) => {
      if (localCard) setCard(localCard);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded || !isAuthenticated || !network.isInternetReachable) return;
    let cancelled = false;
    getPendingChanges().then(async (queue) => {
      for (const pending of queue) {
        try {
          const input = toApiCardInput(pending.card);
          const remote = pending.card.serverId
            ? await updateCardMutation.mutateAsync({ ...input, id: pending.card.serverId, clientMutationId: pending.id, baseVersion: 0 })
            : await createCardMutation.mutateAsync(input);
          if (!cancelled && remote) {
            const synced = { ...fromApiCard(remote), id: pending.card.id };
            await saveLocalCard(synced);
            setCard(synced);
          }
        } catch {
          break;
        }
      }
      if (!cancelled && queue.length) await clearPendingChanges();
    });
    return () => { cancelled = true; };
  }, [loaded, isAuthenticated, network.isInternetReachable, createCardMutation, updateCardMutation]);

  const qrValue = useMemo(() => {
    if (qrMode === "online") return buildOnlineUrl(card, getPublicWebBaseUrl());
    return qrMode === "vcard" ? buildVCard(card) : buildMeCard(card);
  }, [card, qrMode]);

  const update = (key: keyof DigitalCard, value: string) => {
    setSaved(false);
    setCard((current) => ({ ...current, [key]: value, syncStatus: "pending" }));
  };

  const updateLinkAt = (index: number, value: string) => {
    setSaved(false);
    setCard((current) => ({ ...current, syncStatus: "pending", links: current.links.map((link, linkIndex) => linkIndex === index ? { ...link, url: value } : link) }));
  };

  const addSocialLink = () => {
    const next = SOCIAL_OPTIONS.find((option) => !card.links.some((link) => link.platform === option.platform)) ?? SOCIAL_OPTIONS[0];
    setSaved(false);
    setCard((current) => ({ ...current, syncStatus: "pending", links: [...current.links, createLink(next.platform)] }));
  };

  const handleSave = async () => {
    if (!card.name.trim()) {
      Alert.alert("الاسم مطلوب", "أدخل اسمك أولاً حتى تظهر البطاقة بشكل صحيح.");
      return;
    }
    const next: DigitalCard = { ...card, updatedAt: new Date().toISOString(), syncStatus: "pending" };
    await saveLocalCard(next);
    await enqueueChange(next);
    let synced = next;
    if (isAuthenticated && network.isInternetReachable) {
      try {
        const input = toApiCardInput(next);
        const remote = next.serverId
          ? await updateCardMutation.mutateAsync({ ...input, id: next.serverId, clientMutationId: `${next.id}-${Date.now()}`, baseVersion: 0 })
          : await createCardMutation.mutateAsync(input);
        if (remote) {
          synced = { ...fromApiCard(remote), id: next.id };
          await saveLocalCard(synced);
          await clearPendingChanges();
        }
      } catch {
        synced = { ...next, syncStatus: "pending" };
      }
    }
    setCard(synced);
    setSaved(true);
  };

  if (!loaded) return <ScreenContainer />;

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background" safeAreaClassName="bg-background">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <View>
              <Text style={styles.eyebrow}>QR CARD</Text>
              <Text style={styles.heading}>بطاقتك، جاهزة للمشاركة</Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/settings" as never)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} accessibilityLabel="الإعدادات">
              <Text style={styles.iconText}>⚙</Text>
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{card.syncStatus === "synced" ? "تمت المزامنة مع حسابك" : network.isInternetReachable ? "محفوظ محلياً — سيُزامن عند الحفظ" : "وضع أوفلاين — البيانات محفوظة على الجهاز"}</Text>
          </View>
          <View style={styles.quickRow}>
            <Pressable onPress={() => router.push("/scanner" as never)} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}><Text style={styles.quickIcon}>▣</Text><Text style={styles.quickText}>مسح QR</Text></Pressable>
            <Pressable onPress={() => router.push("/nfc" as never)} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}><Text style={styles.quickIcon}>◉</Text><Text style={styles.quickText}>NFC</Text></Pressable>
            <Pressable onPress={() => router.push(`/card/${card.slug}` as never)} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}><Text style={styles.quickIcon}>↗</Text><Text style={styles.quickText}>البطاقة العامة</Text></Pressable>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewGlow} />
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(card.name)}</Text></View>
            <Text style={styles.previewName}>{card.name || "اسمك هنا"}</Text>
            <Text style={styles.previewRole}>{card.jobTitle || "المسمى الوظيفي"}{card.company ? ` · ${card.company}` : ""}</Text>
            {card.bio ? <Text style={styles.previewBio}>{card.bio}</Text> : <Text style={styles.previewBioMuted}>أضف نبذة قصيرة عنك لتظهر هنا</Text>}
            <View style={styles.previewActions}>
              <View style={styles.previewAction}><Text style={styles.previewActionIcon}>☎</Text><Text style={styles.previewActionText}>اتصال</Text></View>
              <View style={styles.previewAction}><Text style={styles.previewActionIcon}>↗</Text><Text style={styles.previewActionText}>مشاركة</Text></View>
              <View style={styles.previewAction}><Text style={styles.previewActionIcon}>＋</Text><Text style={styles.previewActionText}>حفظ</Text></View>
            </View>
          </View>

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>بيانات البطاقة</Text><Text style={styles.sectionHint}>تظهر في المعاينة</Text></View>
          <View style={styles.formCard}>
            <Field label="الاسم الكامل" value={card.name} onChangeText={(v) => update("name", v)} placeholder="مثال: ياسر أبو علاء" />
            <Field label="المعرّف العام للرابط" value={card.slug} onChangeText={(v) => update("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="مثال: yasser-abu-alaa" />
            <Field label="المهنة" value={card.jobTitle} onChangeText={(v) => update("jobTitle", v)} placeholder="مطور برمجيات وتطبيقات Android" />
            <Field label="الشركة أو العمل" value={card.company} onChangeText={(v) => update("company", v)} placeholder="اسم الشركة (اختياري)" />
            <Field label="رقم الهاتف" value={card.phone} onChangeText={(v) => update("phone", v)} placeholder="+90 ..." keyboardType="phone-pad" />
            <Field label="البريد الإلكتروني" value={card.email} onChangeText={(v) => update("email", v)} placeholder="name@example.com" keyboardType="email-address" />
            <Field label="النبذة" value={card.bio} onChangeText={(v) => update("bio", v)} placeholder="اكتب سطراً تعريفياً قصيراً" multiline />
            {card.links.map((link, index) => { const option = SOCIAL_OPTIONS.find((item) => item.platform === link.platform); return <Field key={link.id} label={option?.label ?? link.label} value={link.url} onChangeText={(value) => updateLinkAt(index, value)} placeholder={option?.placeholder ?? "https://..."} keyboardType="url" />; })}
            <Pressable onPress={addSocialLink} style={({ pressed }) => [styles.addLinkButton, pressed && styles.pressed]}><Text style={styles.addLinkText}>＋ إضافة رابط اجتماعي</Text></Pressable>
          </View>

          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>نوع رمز QR</Text><Text style={styles.sectionHint}>اختر طريقة المشاركة</Text></View>
          <View style={styles.modeRow}>
            {(["online", "vcard", "mecard"] as QrMode[]).map((mode) => {
              const labels: Record<QrMode, string> = { online: "رابط متجدد", vcard: "vCard أوفلاين", mecard: "MeCard أوفلاين" };
              return <Pressable key={mode} onPress={() => setQrMode(mode)} style={[styles.modeButton, qrMode === mode && styles.modeButtonActive]}><Text style={[styles.modeText, qrMode === mode && styles.modeTextActive]}>{labels[mode]}</Text></Pressable>;
            })}
          </View>

          <View style={styles.qrPanel}>
            <View style={styles.qrWhite}><QRCode value={qrValue || "https://qr-card.example"} size={172} color="#0B1020" backgroundColor="#FFFFFF" /></View>
            <Text style={styles.qrTitle}>{qrMode === "online" ? "رمز أونلاين قابل للتحديث" : `رمز أوفلاين بصيغة ${qrMode === "vcard" ? "vCard" : "MeCard"}`}</Text>
            <Text style={styles.qrCaption}>{qrMode === "online" ? "عدّل بطاقتك لاحقاً دون إعادة طباعة الرمز" : "بيانات الاتصال محفوظة داخل الرمز ولا تحتاج إلى إنترنت"}</Text>
            <Text selectable style={styles.qrData}>{qrMode === "online" ? qrValue : `${qrValue.slice(0, 110)}${qrValue.length > 110 ? "…" : ""}`}</Text>
          </View>

          <Pressable onPress={handleSave} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
            <Text style={styles.primaryButtonText}>{saved ? "تم الحفظ محلياً ✓" : "حفظ البطاقة وإنشاء الرمز"}</Text>
          </Pressable>
          <Text style={styles.helperText}>يمكنك تعديل البيانات وإنشاء QR جديد في أي وقت. ستتم المزامنة تلقائياً عند توفر الإنترنت.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 44, gap: 18, maxWidth: 720, width: "100%", alignSelf: "center" },
  topBar: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  eyebrow: { color: "#22D3C5", fontSize: 12, letterSpacing: 2, fontWeight: "800", textAlign: "right" },
  heading: { color: "#F8FAFC", fontSize: 26, fontWeight: "800", marginTop: 4, textAlign: "right" },
  iconButton: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#17213A", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#263454" },
  iconText: { fontSize: 23, color: "#C7D2FE" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  statusRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, alignSelf: "flex-end" },
  statusDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#22C55E" },
  statusText: { color: "#94A3B8", fontSize: 12, textAlign: "right" },
  quickRow: { flexDirection: "row-reverse", gap: 8 },
  quickButton: { flex: 1, minHeight: 44, borderRadius: 14, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2A44", alignItems: "center", justifyContent: "center", gap: 3 },
  quickIcon: { color: "#22D3C5", fontSize: 16 },
  quickText: { color: "#CBD5E1", fontSize: 10, fontWeight: "800" },
  previewCard: { overflow: "hidden", borderRadius: 28, padding: 24, alignItems: "center", backgroundColor: "#111A31", borderWidth: 1, borderColor: "#263454", shadowColor: "#050816", shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 5 },
  previewGlow: { position: "absolute", width: 240, height: 150, backgroundColor: "#253B80", opacity: 0.45, borderRadius: 200, top: -78, right: -50 },
  avatar: { width: 76, height: 76, borderRadius: 26, backgroundColor: "#22D3C5", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: "800", color: "#0B1020" },
  previewName: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", textAlign: "center" },
  previewRole: { color: "#A5B4FC", fontSize: 13, marginTop: 4, textAlign: "center" },
  previewBio: { color: "#CBD5E1", fontSize: 13, textAlign: "center", lineHeight: 21, marginTop: 10, maxWidth: 320 },
  previewBioMuted: { color: "#64748B", fontSize: 13, textAlign: "center", marginTop: 10 },
  previewActions: { flexDirection: "row-reverse", gap: 9, marginTop: 20 },
  previewAction: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 100, backgroundColor: "#1B2947" },
  previewActionIcon: { color: "#22D3C5", fontSize: 14 },
  previewActionText: { color: "#E2E8F0", fontSize: 11, fontWeight: "700" },
  sectionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 },
  sectionTitle: { color: "#F8FAFC", fontWeight: "800", fontSize: 17, textAlign: "right" },
  sectionHint: { color: "#64748B", fontSize: 11, textAlign: "right" },
  formCard: { backgroundColor: "#111827", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#1F2A44", gap: 13 },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: "#CBD5E1", fontSize: 12, fontWeight: "700", textAlign: "right" },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: "#0B1020", borderColor: "#263454", borderWidth: 1, paddingHorizontal: 14, color: "#F8FAFC", fontSize: 14, writingDirection: "rtl" },
  textarea: { minHeight: 84, paddingTop: 13 },
  addLinkButton: { minHeight: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: "#334B71" },
  addLinkText: { color: "#22D3C5", fontSize: 12, fontWeight: "800" },
  modeRow: { flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" },
  modeButton: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#111827", borderWidth: 1, borderColor: "#263454" },
  modeButtonActive: { backgroundColor: "#22D3C5", borderColor: "#22D3C5" },
  modeText: { color: "#94A3B8", fontSize: 12, fontWeight: "700" },
  modeTextActive: { color: "#0B1020" },
  qrPanel: { backgroundColor: "#17213A", borderRadius: 24, padding: 18, alignItems: "center", borderWidth: 1, borderColor: "#263454", gap: 8 },
  qrWhite: { padding: 12, borderRadius: 18, backgroundColor: "#FFFFFF" },
  qrTitle: { color: "#F8FAFC", fontSize: 15, fontWeight: "800", textAlign: "center", marginTop: 3 },
  qrCaption: { color: "#94A3B8", fontSize: 12, textAlign: "center", lineHeight: 18 },
  qrData: { color: "#64748B", fontSize: 10, textAlign: "center", maxWidth: 300 },
  primaryButton: { minHeight: 54, borderRadius: 17, backgroundColor: "#22D3C5", alignItems: "center", justifyContent: "center", shadowColor: "#22D3C5", shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  primaryButtonText: { color: "#0B1020", fontSize: 15, fontWeight: "800" },
  helperText: { color: "#64748B", fontSize: 11, lineHeight: 17, textAlign: "center", paddingHorizontal: 18 },
});
