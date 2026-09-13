import CategoryLegend from "@/components/CategoryLegend";
import PeriodicTableGrid from "@/components/PeriodicTableGrid";
import { categoryColor } from "@/constants/element-colors";
import { Colors } from "@/constants/theme-colors";
import { ELEMENTS, ElementData } from "@/data/elements";
import { clearSession } from "@/lib/session";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function PeriodicTableScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<ElementData | null>(null);
  const [query, setQuery] = useState("");

  const handleSelect = (el: ElementData) => {
    setSelected(el);
    router.push(`/element/${el.symbol}` as any);
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace("/login" as any);
  };

  // 2.5 - search for locating an element by name or chemical symbol
  const normalizedQuery = query.trim().toLowerCase();

  const matchedElements = useMemo(() => {
    if (!normalizedQuery) return null;
    return ELEMENTS.filter(
      (el) =>
        el.name.toLowerCase().includes(normalizedQuery) ||
        el.symbol.toLowerCase() === normalizedQuery ||
        el.symbol.toLowerCase().startsWith(normalizedQuery),
    );
  }, [normalizedQuery]);

  const matchedSymbols = useMemo(() => {
    if (!matchedElements) return null;
    return new Set(matchedElements.map((el) => el.symbol));
  }, [matchedElements]);

  const isDimmed = (el: ElementData) => {
    if (!matchedSymbols) return false;
    return !matchedSymbols.has(el.symbol);
  };

  const highlightForElement = (el: ElementData): string | null => {
    if (selected?.number === el.number) return categoryColor(el.category);
    return null;
  };

  const handleClearSearch = () => setQuery("");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Periodic Table</Text>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      {/* 2.5 - Search bar */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or symbol (e.g. Oxygen, O)"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={handleClearSearch} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {matchedElements && (
        <Text style={styles.resultsHint}>
          {matchedElements.length === 0
            ? "No matching elements"
            : `${matchedElements.length} match${matchedElements.length > 1 ? "es" : ""}`}
        </Text>
      )}

            <CategoryLegend />

      <View style={styles.navButtonsRow}>
        <Pressable
          onPress={() => router.push("/compare" as any)}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>Compare Elements</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/trends" as any)}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>Periodic Trends</Text>
        </Pressable>
      </View>

      <PeriodicTableGrid
        onSelect={handleSelect}
        colorForElement={highlightForElement}
        dimIf={isDimmed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
    navButtonsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  navButtonText: {
    color: Colors.cyan,
    fontSize: 12,
    fontWeight: "700",
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  title: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  logoutText: { fontSize: 13, color: Colors.textMuted, fontWeight: "600" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearBtnText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  resultsHint: {
    marginHorizontal: 16,
    marginBottom: 6,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
