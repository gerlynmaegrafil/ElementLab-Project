import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";
import { API_BASE_URL } from "@/lib/api";
import { getToken, saveSession } from "@/lib/session";

type RoleKey = "teacher" | "student" | "personal";

const ROLES: { key: RoleKey; title: string; subtitle: string }[] = [
  { key: "student", title: "Student", subtitle: "Log in to your class." },
  { key: "teacher", title: "Teacher", subtitle: "Manage your sections." },
  { key: "personal", title: "Personal Account", subtitle: "Just for you." },
];

export default function LoginScreen() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
      const existingToken = await getToken();
      if (existingToken) {
        router.replace("/home");
        return;
      }
      setCheckingSession(false);
    })();
  }, []);

  const [lockedForSeconds, setLockedForSeconds] = useState<number | null>(null);

  const startLockCountdown = (seconds: number) => {
    setLockedForSeconds(seconds);
    const interval = setInterval(() => {
      setLockedForSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validate = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing info", "Please enter both username and password.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (lockedForSeconds) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.status === 423) {
        startLockCountdown(data.lockedForSeconds ?? 60);
        Alert.alert("Account locked", data.error);
        return;
      }

      if (!response.ok) {
        const suffix =
          typeof data.attemptsRemaining === "number"
            ? ` (${data.attemptsRemaining} attempt(s) left)`
            : "";
        Alert.alert("Login failed", `${data.error}${suffix}`);
        return;
      }

      // Note: the role picker on this screen is a UI convenience only —
      // the account's actual role always comes from the backend response.
      // If someone picks the wrong tile, login still succeeds and routing
      // below is based on data.user.role, not on selectedRole.
      if (data.user.role !== selectedRole) {
        // no hard block — just let them in as their real role
      }

      await saveSession(data.token, data.user);
      setPassword("");

      if (data.user.role === "teacher") {
        router.replace("/teacher-home");
      } else {
        router.replace("/home");
      }
    } catch (err: any) {
      Alert.alert(
        "Could not log in",
        err.message === "Network request failed"
          ? "Couldn't reach the server. Make sure the backend is running and API_BASE_URL in lib/api.ts is correct."
          : err.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || !!lockedForSeconds;

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </SafeAreaView>
    );
  }

  // Step 1: role picker, shown before username/password ever appear.
  if (!selectedRole) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.hero}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.header}>Welcome to ElementLab</Text>
          <Text style={styles.subheader}>Who's logging in?</Text>
        </View>

        <View style={styles.card}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={styles.roleCard}
              onPress={() => setSelectedRole(r.key)}
            >
              <Text style={styles.roleTitle}>{r.title}</Text>
              <Text style={styles.roleSubtitle}>{r.subtitle}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.linkText}>
              Don&apos;t have an account? <Text style={styles.linkTextBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Step 2: username/password, only after a role has been picked.
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.header}>
              {ROLES.find((r) => r.key === selectedRole)?.title} Login
            </Text>
            <Text style={styles.subheader}>
              Enter your username and password to continue.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === "username" && styles.inputFocused,
              ]}
              placeholder="your_username"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              editable={!isDisabled}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === "password" && styles.inputFocused,
              ]}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isDisabled}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
            />

            {lockedForSeconds ? (
              <Text style={styles.lockedText}>
                Too many attempts. Try again in {lockedForSeconds}s.
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isDisabled}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>Limit: 3 attempts. Lockout for 1 minute.</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setSelectedRole(null);
                setUsername("");
                setPassword("");
              }}
              disabled={submitting}
            >
              <Text style={styles.linkText}>
                <Text style={styles.linkTextBold}>← Choose a different role</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push("/register")}
              disabled={submitting}
            >
              <Text style={styles.linkText}>
                Don&apos;t have an account? <Text style={styles.linkTextBold}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flexGrow: 1, paddingBottom: 40 },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 36, paddingBottom: 28 },
  logo: { width: 96, height: 96, marginBottom: 12 },
  header: { color: Colors.textPrimary, fontSize: 26, fontWeight: "800", marginBottom: 6 },
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
    paddingBottom: 20,
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
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: Colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    backgroundColor: Colors.inputBackground,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: Colors.cyan,
    shadowColor: Colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  lockedText: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.cyan,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: Colors.background, fontWeight: "800", fontSize: 16 },
  hint: { color: Colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 12 },
  linkButton: { marginTop: 18, alignItems: "center" },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkTextBold: { color: Colors.cyan, fontWeight: "700" },
});