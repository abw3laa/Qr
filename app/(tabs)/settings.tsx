import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { clearLocalData } from "@/lib/offline-store";
import { useThemeContext } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";

function SettingRow({ title, description, children, onPress }: { title: string; description?: string; children?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text>{description ? <Text style={styles.rowDescription}>{description}</Text> : null}</View>
      {children}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useThemeContext();
  const { isAuthenticated, user, logout } = useAuth();
  const darkMode = colorScheme === "dark";
  const [autoSync, setAutoSync] = useState(true);
  const [rtl, setRtl] = useState(true);

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert("تعذر فتح الرابط", "تحقق من اتصال الجهاز وحاول مرة أخرى."));
  const clearData = () => Alert.alert("حذف البيانات المحلية؟", "سيتم حذف البطاقة وطابور المزامنة من هذا الجهاز فقط.", [
    { text: "إلغاء", style: "cancel" },
    { text: "حذف", style: "destructive", onPress: async () => { await clearLocalData(); Alert.alert("تم الحذف", "تم حذف البيانات المحلية."); } },
  ]);

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background" safeAreaClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><Text style={styles.eyebrow}>QR CARD</Text><Text style={styles.heading}>الإعدادات</Text><Text style={styles.subheading}>تحكم في تجربتك وبياناتك</Text></View>

        <Text style={styles.sectionTitle}>المظهر واللغة</Text>
        <View style={styles.card}>
          <SettingRow title="الوضع الليلي" description="واجهة داكنة مريحة للعين"><Switch value={darkMode} onValueChange={(value) => setColorScheme(value ? "dark" : "light")} trackColor={{ false: "#334155", true: "#22D3C5" }} thumbColor="#FFFFFF" /></SettingRow>
          <SettingRow title="اللغة العربية" description="اتجاه التطبيق من اليمين إلى اليسار"><Switch value={rtl} onValueChange={setRtl} trackColor={{ false: "#334155", true: "#22D3C5" }} thumbColor="#FFFFFF" /></SettingRow>
        </View>

        <Text style={styles.sectionTitle}>الحساب والمزامنة</Text>
        <View style={styles.card}>
          <SettingRow title={isAuthenticated ? (user?.name || "حسابك متصل") : "تسجيل الدخول"} description={isAuthenticated ? "تتم مزامنة بطاقتك بين الموقع والتطبيق" : "اربط البطاقة بين أجهزتك بأمان"} onPress={() => { if (isAuthenticated) void logout(); else void startOAuthLogin(); }}><Text style={isAuthenticated ? styles.danger : styles.badge}>{isAuthenticated ? "تسجيل الخروج" : "دخول"}</Text></SettingRow>
        </View>

        <Text style={styles.sectionTitle}>المزامنة والخصوصية</Text>
        <View style={styles.card}>
          <SettingRow title="المزامنة التلقائية" description="إرسال التعديلات عند عودة الإنترنت"><Switch value={autoSync} onValueChange={setAutoSync} trackColor={{ false: "#334155", true: "#22D3C5" }} thumbColor="#FFFFFF" /></SettingRow>
          <SettingRow title="بياناتك محلية أولاً" description="تظل البطاقة قابلة للاستخدام دون اتصال"><Text style={styles.badge}>مفعّل</Text></SettingRow>
          <SettingRow title="حذف البيانات المحلية" description="حذف البطاقة وطابور المزامنة من هذا الجهاز" onPress={clearData}><Text style={styles.danger}>حذف</Text></SettingRow>
        </View>

        <Text style={styles.sectionTitle}>حول التطبيق</Text>
        <View style={styles.aboutCard}>
          <View style={styles.logo}><Text style={styles.logoText}>QR</Text></View>
          <Text style={styles.aboutName}>QR Card</Text>
          <Text style={styles.aboutCopy}>بطاقتك الرقمية، دائماً معك</Text>
          <Text style={styles.version}>الإصدار 1.0.0</Text>
        </View>

        <Text style={styles.sectionTitle}>حول المطور</Text>
        <View style={styles.card}>
          <Text style={styles.developerName}>تم التطوير بواسطة ياسر أبو علاء</Text>
          <Text style={styles.developerRole}>مطور برمجيات وتطبيقات أندرويد</Text>
          <View style={styles.links}>
            <Pressable onPress={() => open("https://wa.me/905353883886")} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}><Text style={styles.linkText}>واتساب</Text><Text style={styles.linkValue}>+90 535 388 3886</Text></Pressable>
            <Pressable onPress={() => open("https://www.facebook.com/share/1EudaHJfvZ/")} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}><Text style={styles.linkText}>فيسبوك</Text><Text style={styles.linkValue}>صفحة المطور</Text></Pressable>
            <Pressable onPress={() => open("https://t.me/abw3laa")} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}><Text style={styles.linkText}>تلجرام</Text><Text style={styles.linkValue}>@abw3laa</Text></Pressable>
            <Pressable onPress={() => open("https://github.com/abw3laa/Qr")} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}><Text style={styles.linkText}>GitHub</Text><Text style={styles.linkValue}>abw3laa/Qr</Text></Pressable>
          </View>
        </View>

        <Text style={styles.footer}>صُمم بعناية لمشاركة هويتك الرقمية بأبسط طريقة.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 46, gap: 13, maxWidth: 720, width: "100%", alignSelf: "center" },
  header: { alignItems: "flex-end", marginTop: 8, marginBottom: 9 },
  eyebrow: { color: "#22D3C5", fontSize: 12, letterSpacing: 2, fontWeight: "800" },
  heading: { color: "#F8FAFC", fontSize: 30, fontWeight: "800", marginTop: 4 },
  subheading: { color: "#64748B", fontSize: 13, marginTop: 4 },
  sectionTitle: { color: "#CBD5E1", fontSize: 14, fontWeight: "800", textAlign: "right", marginTop: 12 },
  card: { backgroundColor: "#111827", borderRadius: 22, borderWidth: 1, borderColor: "#1F2A44", paddingHorizontal: 16 },
  row: { minHeight: 72, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottomWidth: 1, borderBottomColor: "#1F2A44" },
  rowCopy: { flex: 1, alignItems: "flex-end" },
  rowTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "700", textAlign: "right" },
  rowDescription: { color: "#64748B", fontSize: 11, marginTop: 4, textAlign: "right" },
  pressed: { opacity: 0.7 },
  badge: { color: "#22D3C5", backgroundColor: "#153B43", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, fontSize: 11, fontWeight: "800" },
  danger: { color: "#F87171", fontSize: 12, fontWeight: "800" },
  aboutCard: { backgroundColor: "#17213A", borderRadius: 24, padding: 22, alignItems: "center", borderWidth: 1, borderColor: "#263454" },
  logo: { width: 62, height: 62, borderRadius: 20, backgroundColor: "#22D3C5", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  logoText: { color: "#0B1020", fontSize: 21, fontWeight: "900", letterSpacing: -1 },
  aboutName: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  aboutCopy: { color: "#A5B4FC", fontSize: 13, marginTop: 5 },
  version: { color: "#64748B", fontSize: 11, marginTop: 12 },
  developerName: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", textAlign: "right", paddingTop: 18 },
  developerRole: { color: "#94A3B8", fontSize: 12, textAlign: "right", marginTop: 5 },
  links: { width: "100%", marginTop: 12 },
  linkButton: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", minHeight: 48, borderTopWidth: 1, borderTopColor: "#1F2A44" },
  linkText: { color: "#CBD5E1", fontSize: 12, fontWeight: "700" },
  linkValue: { color: "#22D3C5", fontSize: 12 },
  footer: { color: "#475569", textAlign: "center", fontSize: 11, paddingHorizontal: 28, marginTop: 10 },
});
