// ElementLab/app/elego/index.tsx
// Activity -> EleGO -> START. No role choices: the account decides.

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";
import { getUser } from "@/lib/session";

export default function EleGoStartScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser();
        if (!user) {
          router.replace("/");
          return;
        }
        setRole(user.role ?? null);
      } catch {
        router.replace("/");
        return;
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTeacher = role === "teacher";

  const handleStart = () => {
    router.push((isTeacher ? "/elego/teacher" : "/elego/student") as any);
  };

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
          {isTeacher
            ? "Open a game for your class, watch your students join, and call the elements."
            : "Your bingo card is dealt as soon as you start. You'll join your teacher's game automatically."}
        </Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={Colors.cyan} size="large" />
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.startButtonText}>START</Text>
          </TouchableOpacity>
        )}
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
  hero: { alignItems: "center", paddingHorizontal: 24, marginTop: 12, marginBottom: 32 },
  heroEmoji: { fontSize: 30, marginBottom: 10 },
  heroTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "800" },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  body: { paddingHorizontal: 24 },
  startButton: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  startButtonText: {
    color: Colors.background,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },
});