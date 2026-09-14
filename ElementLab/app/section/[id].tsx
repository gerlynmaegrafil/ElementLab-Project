import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/session";

type Student = {
  _id: string;
  name: string;
  username: string;
};

type SectionDetail = {
  _id: string;
  name: string;
  code: string;
};

export default function SectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [section, setSection] = useState<SectionDetail | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/sections/${id}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load section");
      setSection(data.section);
      setStudents(data.students);
    } catch (err: any) {
      Alert.alert("Error", err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !section) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{section.name}</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>{section.code}</Text>
        </View>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No students yet. Share the code {section.code} with them so they can join.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.studentRow}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentUsername}>@{item.username}</Text>
          </View>
        )}
      />
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  backText: { color: Colors.cyan, fontSize: 14, fontWeight: "600", marginBottom: 10 },
  headerTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: 8 },
  codeBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.cyan,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  codeBadgeText: { color: Colors.cyan, fontWeight: "800", letterSpacing: 1.5 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 40 },
  studentRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentName: { color: Colors.textPrimary, fontSize: 15, fontWeight: "700" },
  studentUsername: { color: Colors.textSecondary, fontSize: 13 },
});