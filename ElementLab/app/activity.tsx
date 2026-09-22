// ElementLab/app/activity.tsx

import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";

type ChoiceItem = {
  key: string;
  icon: string;
  title: string;
  description: string;
  iconBg: string;
  enabled: boolean;
};

const CHOICES: ChoiceItem[] = [
  {
    key: "elego",
    icon: "🔴",
    title: "EleGO",
    description: "Element BINGO — the teacher calls elements, you shade your card.",
    iconBg: Colors.red,
    enabled: true,
  },
  {
    key: "quiz",
    icon: "📝",
    title: "QUIZ",
    description: "Timed multiple-choice questions on the elements.",
    iconBg: Colors.blue,
    enabled: false,
  },
  {
    key: "assessment",
    icon: "📊",
    title: "ASSESSMENT",
    description: "A graded set of questions covering the whole unit.",
    iconBg: Colors.purple,
    enabled: false,
  },
];

export default function ActivityScreen() {
  const router = useRouter();

  const handlePress = (item: ChoiceItem) => {
    if (item.key === "elego") {
      router.push("/elego" as any);
      return;
    }
    Alert.alert(item.title, "Coming soon!");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.subtitle}>Pick how you want to play today.</Text>

      <View style={styles.body}>
        {CHOICES.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.card, !item.enabled && styles.cardDisabled]}
            onPress={() => handlePress(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBadge, { backgroundColor: item.iconBg }]}>
              <Text style={styles.iconBadgeText}>{item.icon}</Text>
            </View>
            <View style={styles.cardText}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.enabled && (
                  <View style={styles.soonPill}>
                    <Text style={styles.soonPillText}>Soon</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { color: Colors.textPrimary, fontSize: 26, fontWeight: "600" },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: "800" },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  body: { paddingHorizontal: 20, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  cardDisabled: { opacity: 0.55 },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconBadgeText: { fontSize: 22 },
  cardText: { flex: 1 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  soonPill: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonPillText: { color: Colors.textMuted, fontSize: 10, fontWeight: "700" },
  cardDescription: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  chevron: { color: Colors.textMuted, fontSize: 22, marginLeft: 8 },
});