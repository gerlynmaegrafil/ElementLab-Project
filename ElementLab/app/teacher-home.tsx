import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";
import { API_BASE_URL } from "@/lib/api";
import { clearSession, getToken } from "@/lib/session";

type Section = {
  _id: string;
  name: string;
  code: string;
  studentCount: number;
};

export default function TeacherHomeScreen() {
  const router = useRouter();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadSections = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/sections/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load sections");
      setSections(data);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSections();
    }, [loadSections])
  );

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      Alert.alert("Missing info", "Please enter a section name.");
      return;
    }
    setCreating(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSectionName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create section");

      setModalVisible(false);
      setNewSectionName("");
      await loadSections();
      Alert.alert("Section created", `Share this code with your students: ${data.code}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace("/");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sections</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadSections();
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            You haven't created any sections yet. Tap "+ New Section" to start.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => router.push(`/section/${item._id}` as any)}
          >
            <View>
              <Text style={styles.sectionName}>{item.name}</Text>
              <Text style={styles.sectionMeta}>
                {item.studentCount} student{item.studentCount === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{item.code}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ New Section</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Section</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Grade 10 - Chemistry"
              placeholderTextColor={Colors.textMuted}
              value={newSectionName}
              onChangeText={setNewSectionName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setModalVisible(false);
                  setNewSectionName("");
                }}
                disabled={creating}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreate}
                onPress={handleCreateSection}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.background} size="small" />
                ) : (
                  <Text style={styles.modalCreateText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: "800" },
  logoutText: { color: Colors.cyan, fontSize: 14, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  sectionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionName: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700" },
  sectionMeta: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  codeBadge: {
    borderWidth: 1,
    borderColor: Colors.cyan,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  codeBadgeText: { color: Colors.cyan, fontWeight: "800", letterSpacing: 1.5 },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  fabText: { color: Colors.background, fontWeight: "800", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: "800", marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.inputBackground,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 14 },
  modalCancelText: { color: Colors.textSecondary, fontWeight: "600" },
  modalCreate: {
    backgroundColor: Colors.cyan,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 80,
    alignItems: "center",
  },
  modalCreateText: { color: Colors.background, fontWeight: "800" },
});