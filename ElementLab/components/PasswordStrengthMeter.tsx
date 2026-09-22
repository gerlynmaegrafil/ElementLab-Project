import { Colors } from "@/constants/theme-colors";
import { getPasswordChecks, getPasswordStrength } from "@/lib/password";
import { StyleSheet, Text, View } from "react-native";

export default function PasswordStrengthMeter({
  password,
}: {
  password: string;
}) {
  if (!password) return null;

  const checks = getPasswordChecks(password);
  const strength = getPasswordStrength(password);
  const segments = 5;

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {Array.from({ length: segments }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                backgroundColor:
                  i < strength.score ? strength.color : Colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: strength.color }]}>
        {strength.label}
      </Text>

      {checks.map((c) => (
        <Text
          key={c.label}
          style={[
            styles.checkItem,
            { color: c.passed ? "#43a047" : Colors.textMuted },
          ]}
        >
          {c.passed ? "✓" : "○"} {c.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: -8, marginBottom: 16 },
  barRow: { flexDirection: "row", gap: 4, marginBottom: 6 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  checkItem: { fontSize: 12, marginBottom: 2 },
});
