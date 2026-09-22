import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors } from "@/constants/theme-colors";

export type SelectOption = { code: string; name: string; subtitle?: string };

type Props = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  loading?: boolean;
  emptyMessage?: string;
  onSelect: (option: SelectOption) => void;
  onClose: () => void;
};

export default function SelectModal({
  visible,
  title,
  options,
  loading,
  emptyMessage = "No options available.",
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Search..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={Colors.cyan} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 420 }}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => {
                    setQuery("");
                    onSelect(item);
                  }}
                >
                  <Text style={styles.rowText}>{item.name}</Text>
                  {item.subtitle ? (
                    <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                  ) : null}
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: "800", color: Colors.textPrimary },
  closeText: { fontSize: 16, color: Colors.textMuted, fontWeight: "700" },
  search: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    backgroundColor: Colors.inputBackground,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  centerBox: { paddingVertical: 30, alignItems: "center" },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  row: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowPressed: { opacity: 0.6 },
  rowText: { color: Colors.textPrimary, fontSize: 15 },
  rowSubtitle: { color: Colors.textMuted, fontSize: 12 },
});
