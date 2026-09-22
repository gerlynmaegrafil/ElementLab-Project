// ElementLab/app/elego/index.tsx

import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";

export default function EleGoRoleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>EleGO</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🔴🟡🟢</Text>
        <Text style={styles.heroTitle}>Element BINGO</Text>
        <Text style={styles.heroSubtitle}>
          One teacher calls out random elements. Students shade the matching
          symbol on their own card. First full line wins!
        </Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push("/elego/teacher" as any)}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBadge, { backgroundColor: Colors.cyan }]}>
            <Text style={styles.iconBadgeText}>🧑‍🏫</Text>
          </View>
          <View style={styles.roleText}>
            <Text style={styles.roleTitle}>I'm the Teacher</Text>
            <Text style={styles.roleDescription}>
              Create a room, spin for random elements, and control the game.
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => router.push("/elego/student" as any)}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBadge, { backgroundColor: Colors.green }]}>
            <Text style={styles.iconBadgeText}>🎓</Text>
          </View>
          <View style={styles.roleText}>
            <Text style={styles.roleTitle}>I'm a Student</Text>
            <Text style={styles.roleDescription}>
              Join with the room code your teacher shows and shade your card.
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
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
  hero: { alignItems: "center", paddingHorizontal: 24, marginTop: 12, marginBottom: 24 },
  heroEmoji: { fontSize: 30, marginBottom: 10 },
  heroTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "800" },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  body: { paddingHorizontal: 20, gap: 12 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconBadgeText: { fontSize: 22 },
  roleText: { flex: 1 },
  roleTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: "800" },
  roleDescription: { color: Colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 },
  chevron: { color: Colors.textMuted, fontSize: 22, marginLeft: 8 },
});