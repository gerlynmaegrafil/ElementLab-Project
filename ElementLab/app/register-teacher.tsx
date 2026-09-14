import { useRouter } from "expo-router";
import { useState } from "react";
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
import { saveSession } from "@/lib/session";

export default function RegisterTeacherScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validate = () => {
    if (!name.trim()) {
      Alert.alert("Missing info", "Please enter your name.");
      return false;
    }
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert("Missing info", "Username must be at least 3 characters.");
      return false;
    }
    if (!password || password.length < 6) {
      Alert.alert("Missing info", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please re-enter your password.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          password,
          role: "teacher",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      await saveSession(data.token, data.user);
      Alert.alert("Welcome!", "Your teacher account has been created.", [
        { text: "Continue", onPress: () => router.replace("/teacher-home") },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Could not register",
        err.message === "Network request failed"
          ? "Couldn't reach the server. Make sure the backend is running."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];
  const focusHandlers = (field: string) => ({
    onFocus: () => setFocusedField(field),
    onBlur: () => setFocusedField(null),
  });

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
              source={require("@/assets/images/logo-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.header}>Teacher Registration</Text>
            <Text style={styles.subheader}>
              You'll be able to create class sections after signing up.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={inputStyle("name")}
              placeholder="Juan Dela Cruz"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              {...focusHandlers("name")}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={inputStyle("username")}
              placeholder="your_username"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              {...focusHandlers("username")}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={inputStyle("password")}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              {...focusHandlers("password")}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={inputStyle("confirmPassword")}
              placeholder="Re-enter your password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              {...focusHandlers("confirmPassword")}
            />

            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace("/")}
              disabled={submitting}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Log in</Text>
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
  container: { flexGrow: 1, paddingBottom: 40 },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  logo: { width: 64, height: 64, marginBottom: 10 },
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
    paddingBottom: 20,
  },
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
  linkButton: { marginTop: 18, alignItems: "center" },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkTextBold: { color: Colors.cyan, fontWeight: "700" },
});