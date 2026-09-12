import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";
import { API_BASE_URL } from "@/lib/api";
import { clearSession, getUser, StoredUser } from "@/lib/session";

type QuickAccessItem = {
  icon: string;
  title: string;
  iconBg: string;
};

const QUICK_ACCESS: QuickAccessItem[] = [
  { icon: "⚛️", title: "Atomic Structure Quiz", iconBg: Colors.green },
  { icon: "ℹ️", title: "Element Info Challenge", iconBg: Colors.blue },
  { icon: "📈", title: "Periodic Trends Test", iconBg: Colors.purple },
];

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getUser();
      if (!stored) {
        router.replace("/");
        return;
      }
      setUser(stored);
      setChecking(false);
    })();
  }, []);

  const handleLogout = async () => {
    // 1.6 - terminate the current session
    try {
      await fetch(`${API_BASE_URL}/api/users/logout`, { method: "POST" });
    } catch {
      // Non-fatal - we still clear the local session below
    }
    await clearSession();
    router.replace("/");
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/logo-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brand}>ElementLab</Text>
            <Text style={styles.greeting}>
              Hi, {user?.name?.split(" ")[0]}!
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutPill} onPress={handleLogout}>
          <Text style={styles.logoutPillText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Quick access cards */}
      <View style={styles.body}>
        {QUICK_ACCESS.map((item) => (
          <TouchableOpacity key={item.title} style={styles.quickCard}>
            <View style={[styles.iconBadge, { backgroundColor: item.iconBg }]}>
              <Text style={styles.iconBadgeText}>{item.icon}</Text>
            </View>
            <Text style={styles.quickCardTitle}>{item.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Quiz</Text>
        </TouchableOpacity>

        {/* Recent scores */}
        <Text style={styles.recentLabel}>Recent Scores:</Text>
        <View style={styles.scoresRow}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>85%</Text>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>50%</Text>
          </View>
        </View>
      </View>

      {/* Bottom nav */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Text style={[styles.navIcon, styles.navIconActive]}>🏠</Text>
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/periodic-table" as any)}
        >
          <Text style={styles.navIcon}>🧪</Text>
          <Text style={styles.navLabel}>Periodic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navIcon}>⚗️</Text>
          <Text style={styles.navLabel}>Simulator</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navIcon}>📝</Text>
          <Text style={styles.navLabel}>Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
  },
  brand: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  logoutPill: {
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  logoutPillText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconBadgeText: {
    fontSize: 18,
  },
  quickCardTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.cardAlt,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    width: "65%",
    height: "100%",
    backgroundColor: Colors.cyan,
    borderRadius: 3,
  },
  startButton: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  startButtonText: {
    color: Colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  recentLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  scoresRow: {
    flexDirection: "row",
    gap: 12,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    color: Colors.cyan,
    fontSize: 12,
    fontWeight: "800",
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: Colors.cardAlt,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
    paddingBottom: 16,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: "center",
  },
  navLabelActive: {
    fontSize: 9,
    color: Colors.cyan,
    fontWeight: "700",
    textAlign: "center",
  },
});
