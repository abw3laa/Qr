import { useState } from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { saveCardToContacts } from "@/lib/contact";
import { isOnlineCardUrl, parseContactPayload } from "@/lib/qr-codec";
import type { DigitalCard } from "@/shared/card";

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [result, setResult] = useState<{ raw: string; card: Partial<DigitalCard> | null } | null>(null);

  const handleValue = (value: string) => {
    if (!value.trim()) return;
    setScanned(true);
    if (isOnlineCardUrl(value)) {
      void Linking.openURL(value).catch(() => Alert.alert("تعذر فتح الرابط", value));
      return;
    }
    setResult({ raw: value, card: parseContactPayload(value) });
  };

  const handleBarcode = ({ data }: BarcodeScanningResult) => handleValue(data);
  const save = async () => {
    if (!result?.card) return;
    const saved = await saveCardToContacts({ name: result.card.name ?? "جهة اتصال QR", phone: result.card.phone ?? "", email: result.card.email ?? "", company: result.card.company ?? "", jobTitle: result.card.jobTitle ?? "" });
    if (saved === "saved") Alert.alert("تم الحفظ", "تمت إضافة جهة الاتصال إلى هاتفك.");
    else if (saved === "unsupported") Alert.alert("الحفظ من الويب", "افتح هذا الرمز داخل APK Android لحفظ جهة الاتصال مباشرة.");
    else Alert.alert("الصلاحية مطلوبة", "اسمح بالوصول إلى جهات الاتصال ثم حاول مرة أخرى.");
  };

  if (!permission) return <ScreenContainer className="items-center justify-center"><Text style={styles.muted}>جاري تجهيز الكاميرا…</Text></ScreenContainer>;
  if (!permission.granted && Platform.OS !== "web") return <ScreenContainer className="items-center justify-center" edges={["top", "bottom", "left", "right"]}><View style={styles.permissionCard}><Text style={styles.title}>نحتاج إلى الكاميرا</Text><Text style={styles.muted}>اسمح لـ QR Card بمسح رمز QR من الكاميرا.</Text><Pressable onPress={requestPermission} style={styles.primary}><Text style={styles.primaryText}>السماح بالكاميرا</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.backText}>العودة</Text></Pressable></View></ScreenContainer>;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-background" safeAreaClassName="bg-background">
      <View style={styles.page}>
        <View style={styles.top}><Pressable onPress={() => router.back()}><Text style={styles.backText}>رجوع</Text></Pressable><View><Text style={styles.eyebrow}>QR CARD</Text><Text style={styles.heading}>مسح رمز</Text></View></View>
        <Text style={styles.intro}>وجّه الكاميرا إلى رمز QR أو ألصق بيانات vCard أو MeCard يدوياً.</Text>
        <View style={styles.cameraBox}>
          {Platform.OS === "web" || permission.granted ? <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scanned ? undefined : handleBarcode}><View style={styles.scanFrame} /></CameraView> : <Text style={styles.muted}>الكاميرا غير متاحة</Text>}
        </View>
        {scanned ? <Pressable onPress={() => { setScanned(false); setResult(null); }} style={styles.secondary}><Text style={styles.secondaryText}>مسح رمز آخر</Text></Pressable> : null}
        <View style={styles.manualBox}><Text style={styles.manualTitle}>بديل بدون كاميرا</Text><TextInput value={manualValue} onChangeText={setManualValue} placeholder="الصق vCard أو MeCard هنا" placeholderTextColor="#64748B" multiline style={styles.input} textAlign="right" autoCapitalize="none" /><Pressable onPress={() => handleValue(manualValue)} style={styles.primary}><Text style={styles.primaryText}>تحليل البيانات</Text></Pressable></View>
        {result?.card ? <View style={styles.resultBox}><Text style={styles.resultTitle}>تم التعرف على جهة اتصال</Text><Text style={styles.resultName}>{result.card.name}</Text>{result.card.jobTitle ? <Text style={styles.resultLine}>{result.card.jobTitle}</Text> : null}{result.card.phone ? <Text style={styles.resultLine}>{result.card.phone}</Text> : null}{result.card.email ? <Text style={styles.resultLine}>{result.card.email}</Text> : null}<Pressable onPress={save} style={styles.primary}><Text style={styles.primaryText}>حفظ جهة الاتصال</Text></Pressable></View> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20, gap: 14, maxWidth: 620, width: "100%", alignSelf: "center" },
  top: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  eyebrow: { color: "#22D3C5", fontSize: 12, letterSpacing: 2, fontWeight: "800", textAlign: "right" },
  heading: { color: "#F8FAFC", fontSize: 28, fontWeight: "900", textAlign: "right", marginTop: 3 },
  intro: { color: "#94A3B8", fontSize: 13, textAlign: "right", lineHeight: 20 },
  backText: { color: "#22D3C5", fontSize: 13, fontWeight: "800", paddingTop: 8 },
  cameraBox: { height: 300, overflow: "hidden", borderRadius: 26, backgroundColor: "#0B1020", borderWidth: 1, borderColor: "#263454", alignItems: "center", justifyContent: "center" },
  camera: { width: "100%", height: "100%" },
  scanFrame: { width: 190, height: 190, borderRadius: 28, borderWidth: 2, borderColor: "#22D3C5", alignSelf: "center", marginTop: 55 },
  permissionCard: { backgroundColor: "#111827", borderRadius: 24, padding: 22, gap: 14, alignItems: "center", maxWidth: 340 },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", textAlign: "center" },
  muted: { color: "#94A3B8", fontSize: 13, textAlign: "center", lineHeight: 20 },
  primary: { minHeight: 48, borderRadius: 14, backgroundColor: "#22D3C5", justifyContent: "center", alignItems: "center", paddingHorizontal: 18, marginTop: 4 },
  primaryText: { color: "#0B1020", fontWeight: "900", fontSize: 13 },
  secondary: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: "#22D3C5", justifyContent: "center", alignItems: "center" },
  secondaryText: { color: "#22D3C5", fontWeight: "800", fontSize: 13 },
  manualBox: { backgroundColor: "#111827", borderRadius: 22, borderWidth: 1, borderColor: "#1F2A44", padding: 16, gap: 10 },
  manualTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "800", textAlign: "right" },
  input: { minHeight: 84, borderRadius: 14, backgroundColor: "#0B1020", borderWidth: 1, borderColor: "#263454", color: "#F8FAFC", padding: 12, writingDirection: "rtl" },
  resultBox: { backgroundColor: "#17213A", borderRadius: 22, borderWidth: 1, borderColor: "#22D3C5", padding: 18, gap: 7, alignItems: "flex-end" },
  resultTitle: { color: "#22D3C5", fontSize: 12, fontWeight: "800" },
  resultName: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  resultLine: { color: "#CBD5E1", fontSize: 13 },
});
