import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { loadLocalCard } from "@/lib/offline-store";
import { buildMeCard, buildOnlineUrl, buildVCard, parseContactPayload } from "@/lib/qr-codec";
import { isNfcSupported, readNdefPayload, writeNdefPayload } from "@/lib/nfc";
import { saveCardToContacts } from "@/lib/contact";
import type { DigitalCard } from "@/shared/card";
import { getPublicWebBaseUrl } from "@/lib/public-url";

export default function NfcScreen() {
  const router = useRouter();
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [readValue, setReadValue] = useState<{ value: string; kind: "uri" | "text" } | null>(null);

  useEffect(() => {
    loadLocalCard().then(setCard);
    isNfcSupported().then(setSupported);
  }, []);

  const write = async (kind: "uri" | "text", payload: string) => {
    setBusy(true);
    try {
      await writeNdefPayload(payload, kind);
      Alert.alert("تمت الكتابة", "تم حفظ البيانات على شريحة NFC بنجاح.");
    } catch (error) {
      Alert.alert(error instanceof Error && error.message === "NFC_UNSUPPORTED" ? "NFC غير متاح" : "تعذر الكتابة", "تأكد من تشغيل NFC وتقريب الهاتف من شريحة قابلة للكتابة، أو استخدم QR كبديل.");
    } finally { setBusy(false); }
  };

  const read = async () => {
    setBusy(true);
    try {
      setReadValue(await readNdefPayload());
    } catch (error) {
      Alert.alert(error instanceof Error && error.message === "NFC_UNSUPPORTED" ? "NFC غير متاح" : "تعذر القراءة", "استخدم شاشة مسح QR كبديل.");
    } finally { setBusy(false); }
  };

  const offlinePayload = card ? buildVCard(card) : "BEGIN:VCARD\nVERSION:3.0\nFN:QR Card\nEND:VCARD";
  const mecardPayload = card ? buildMeCard(card) : "MECARD:N:QR Card;;";
  const onlinePayload = card ? buildOnlineUrl(card, getPublicWebBaseUrl()) : `${getPublicWebBaseUrl()}/c/my-card`;
  const parsed = readValue?.kind === "text" ? parseContactPayload(readValue.value) : null;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" safeAreaClassName="bg-background">
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.top}><Pressable onPress={() => router.back()}><Text style={styles.back}>رجوع</Text></Pressable><View><Text style={styles.eyebrow}>QR CARD</Text><Text style={styles.heading}>NFC</Text></View></View>
        <Text style={styles.intro}>اكتب رابط بطاقتك أو بيانات الاتصال على شريحة NFC، أو اقرأ شريحة موجودة.</Text>
        <View style={[styles.status, supported === false && styles.statusWarn]}><View style={[styles.dot, supported === false && styles.dotWarn]} /><Text style={styles.statusText}>{supported === null ? "جارٍ التحقق من دعم NFC…" : supported ? "NFC متاح على هذا الجهاز" : "NFC غير متاح — استخدم QR بدلاً منه"}</Text></View>

        <View style={styles.card}><Text style={styles.cardTitle}>الكتابة على شريحة NFC</Text><Text style={styles.cardHint}>قرّب الهاتف من الشريحة عندما تظهر رسالة الانتظار.</Text><Pressable disabled={busy} onPress={() => write("uri", onlinePayload)} style={styles.primary}><Text style={styles.primaryText}>{busy ? "انتظر…" : "كتابة رابط أونلاين قابل للتحديث"}</Text></Pressable><Pressable disabled={busy} onPress={() => write("text", offlinePayload)} style={styles.secondary}><Text style={styles.secondaryText}>كتابة vCard أوفلاين</Text></Pressable><Pressable disabled={busy} onPress={() => write("text", mecardPayload)} style={styles.secondary}><Text style={styles.secondaryText}>كتابة MeCard أوفلاين</Text></Pressable></View>
        <View style={styles.card}><Text style={styles.cardTitle}>قراءة شريحة NFC</Text><Text style={styles.cardHint}>تُحلّل الصفحة رابطاً أو بيانات اتصال نصية.</Text><Pressable disabled={busy} onPress={read} style={styles.primary}><Text style={styles.primaryText}>{busy ? "انتظر…" : "قراءة الشريحة"}</Text></Pressable></View>
        {readValue ? <View style={styles.result}><Text style={styles.resultTitle}>تمت القراءة</Text><Text style={styles.resultKind}>{readValue.kind === "uri" ? "رابط أونلاين" : "بيانات أوفلاين"}</Text><Text selectable style={styles.resultValue}>{readValue.value}</Text>{parsed ? <><Text style={styles.resultName}>{parsed.name}</Text><Text style={styles.resultLine}>{parsed.phone ?? parsed.email ?? "بيانات اتصال"}</Text><Pressable onPress={async () => { const result = await saveCardToContacts({ name: parsed.name ?? "جهة اتصال NFC", phone: parsed.phone ?? "", email: parsed.email ?? "", company: parsed.company ?? "", jobTitle: parsed.jobTitle ?? "" }); Alert.alert(result === "saved" ? "تم الحفظ" : "حفظ جهة الاتصال", result === "saved" ? "أُضيفت الجهة إلى هاتفك." : "استخدم APK Android أو شارك البيانات كـ vCard."); }} style={styles.primary}><Text style={styles.primaryText}>حفظ جهة الاتصال</Text></Pressable></> : null}</View> : null}
        <Pressable onPress={() => router.push("/scanner" as never)} style={styles.qrFallback}><Text style={styles.qrFallbackTitle}>لا يدعم جهازك NFC؟</Text><Text style={styles.qrFallbackText}>استخدم QR، يعمل على جميع الأجهزة تقريباً</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 46, gap: 14, maxWidth: 620, width: "100%", alignSelf: "center" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  back: { color: "#22D3C5", fontSize: 13, fontWeight: "800", paddingTop: 8 },
  eyebrow: { color: "#22D3C5", fontSize: 12, letterSpacing: 2, fontWeight: "800", textAlign: "right" },
  heading: { color: "#F8FAFC", fontSize: 28, fontWeight: "900", textAlign: "right", marginTop: 3 },
  intro: { color: "#94A3B8", fontSize: 13, lineHeight: 20, textAlign: "right" },
  status: { flexDirection: "row-reverse", alignItems: "center", gap: 8, borderRadius: 14, padding: 12, backgroundColor: "#153B43" },
  statusWarn: { backgroundColor: "#3B2C17" },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#22C55E" },
  dotWarn: { backgroundColor: "#F59E0B" },
  statusText: { color: "#D1FAE5", fontSize: 12, fontWeight: "700", textAlign: "right" },
  card: { backgroundColor: "#111827", borderRadius: 22, borderWidth: 1, borderColor: "#1F2A44", padding: 17, gap: 10 },
  cardTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "900", textAlign: "right" },
  cardHint: { color: "#64748B", fontSize: 12, lineHeight: 18, textAlign: "right" },
  primary: { minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#22D3C5", marginTop: 4 },
  primaryText: { color: "#0B1020", fontSize: 13, fontWeight: "900" },
  secondary: { minHeight: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#334B71" },
  secondaryText: { color: "#CBD5E1", fontSize: 13, fontWeight: "800" },
  result: { backgroundColor: "#17213A", borderRadius: 22, padding: 18, gap: 7, borderWidth: 1, borderColor: "#22D3C5", alignItems: "flex-end" },
  resultTitle: { color: "#22D3C5", fontSize: 12, fontWeight: "900" },
  resultKind: { color: "#A5B4FC", fontSize: 12 },
  resultValue: { color: "#94A3B8", fontSize: 10, textAlign: "right" },
  resultName: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  resultLine: { color: "#CBD5E1", fontSize: 13 },
  qrFallback: { backgroundColor: "#111827", borderRadius: 20, borderWidth: 1, borderColor: "#263454", padding: 16, gap: 5 },
  qrFallbackTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "800", textAlign: "right" },
  qrFallbackText: { color: "#22D3C5", fontSize: 12, textAlign: "right" },
});
