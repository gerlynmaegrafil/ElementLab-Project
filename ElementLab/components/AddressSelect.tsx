import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/theme-colors";

export type AddressOption = {
  code: string;
  label: string;
};

type AddressSelectProps = {
  label: string;
  placeholder: string;
  loadingLabel?: string;
  value: AddressOption | null;
  options: AddressOption[];
  loading?: boolean;
  disabled?: boolean;
  onSelect: (option: AddressOption) => void;
};

export default function AddressSelect({
  label,
  placeholder,
  loadingLabel = "Loading...",
  value,
  options,
  loading = false,
  disabled = false,
  onSelect,
}: AddressSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = () => {
    if (disabled || loading) return;
    setModalVisible(true);
  };

  const handleSelect = (option: AddressOption) => {
    onSelect(option);
    setSearch("");
    setModalVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.input, disabled && styles.inputDisabled]}
        onPress={handleOpen}
        activeOpacity={disabled ? 1 : 0.7}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.cyan} />
            <Text style={styles.loadingText}>{loadingLabel}</Text>
          </View>
        ) : (
          <Text
            style={value ? styles.inputText : styles.placeholderText}
            numberOfLines={1}
          >
            {value ? value.label : placeholder}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.code}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matches found.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSearch("");
                setModalVisible(false);
              }}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 0 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    justifyContent: "center",
    backgroundColor: Colors.inputBackground,
  },
  inputDisabled: { opacity: 0.5 },
  inputText: { color: Colors.textPrimary, fontSize: 15 },
  placeholderText: { color: Colors.textMuted, fontSize: 15 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: "75%",
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 14,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: Colors.inputBackground,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  list: { marginBottom: 12 },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: { color: Colors.textPrimary, fontSize: 15 },
  closeButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  closeButtonText: { color: Colors.cyan, fontWeight: "700", fontSize: 15 },
});