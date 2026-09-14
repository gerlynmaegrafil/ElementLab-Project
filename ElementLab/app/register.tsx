import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";

export default function RegisterChooseRoleScreen() {
  const router = useRouter();

  const roles = [
    {
      key: "student",
      title: "Student",
      subtitle: "Join a class using a section code from your teacher.",
      route: "/register-student",
    },
    {
      key: "teacher",
      title: "Teacher",
      subtitle: "Create and manage your own class sections.",
      route: "/register-teacher",
    },
    {
      key: "personal",
      title: "Personal Account",
      subtitle: "Just for you — no class, no section code.",
      route: "/register-personal",
    },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.hero}>
        <Image
          source={require("@/assets/images/logo-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.header}>Create an Account</Text>
        <Text style={styles.subheader}>Choose the type of account you need.</Text>
      </View>

      <View style={styles.card}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={styles.roleCard}
            onPress={() => router.push(r.route as any)}
          >
            <Text style={styles.roleTitle}>{r.title}</Text>
            <Text style={styles.roleSubtitle}>{r.subtitle}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 36, paddingBottom: 24 },
  logo: { width: 72, height: 72, marginBottom: 12 },
  header: { color: Colors.textPrimary, fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subheader: { color: Colors.textSecondary, fontSize: 14, textAlign: "center" },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    backgroundColor: Colors.inputBackground,
  },
  roleTitle: { color: Colors.cyan, fontSize: 17, fontWeight: "800", marginBottom: 4 },
  roleSubtitle: { color: Colors.textSecondary, fontSize: 13 },
  linkButton: { marginTop: 4, alignItems: "center" },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkTextBold: { color: Colors.cyan, fontWeight: "700" },
});