import { categoryColor, categoryLabels } from "@/constants/element-colors";
import { Colors } from "@/constants/theme-colors";
import AtomicStructure from "@/components/AtomicStructure";
import { getElementBySymbol, kelvinToCelsius } from "@/data/elements";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ElementDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const element = symbol ? getElementBySymbol(symbol) : undefined;

  if (!element) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textPrimary }}>Element not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: Colors.textMuted }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const color = categoryColor(element.category);
  const meltC = kelvinToCelsius(element.meltK);
  const boilC = kelvinToCelsius(element.boilK);

  const rows: [string, string][] = [
    ["Atomic number", String(element.number)],
    ["Atomic mass", element.mass !== null ? `${element.mass} u` : "—"],
    ["Category", categoryLabels[element.category] ?? element.category],
    ["Phase", element.phase ?? "—"],
    ["Block", element.block ?? "—"],
    ["Period / Group", `${element.period} / ${element.group ?? "—"}`],
    ["Density", element.density !== null ? `${element.density} g/cm³` : "—"],
    ["Melting point", meltC !== null ? `${meltC} °C` : "—"],
    ["Boiling point", boilC !== null ? `${boilC} °C` : "—"],
    [
      "Electronegativity",
      element.electronegativity !== null
        ? String(element.electronegativity)
        : "—",
    ],
    ["Electron config", element.electronConfig ?? "—"],
    ["Shells", element.shells.join(", ")],
    ["Protons", String(element.protons)],
    ["Neutrons", element.neutrons !== null ? String(element.neutrons) : "—"],
    ["Electrons", String(element.electrons)],
    [
      "Ionization energy",
      element.ionizationEnergy !== null
        ? `${element.ionizationEnergy} eV`
        : "—",
    ],
    ["Discovered by", element.discoveredBy ?? "—"],
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

            <View style={[styles.hero, { backgroundColor: color }]}>
        <Text style={styles.heroNumber}>{element.number}</Text>
        <Text style={styles.heroSymbol}>{element.symbol}</Text>
        <Text style={styles.heroName}>{element.name}</Text>
      </View>

      <AtomicStructure
        shells={element.shells}
        protons={element.protons}
        neutrons={element.neutrons}
        symbol={element.symbol}
      />

      <View style={styles.table}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: Colors.textMuted, fontSize: 14, fontWeight: "600" },
  hero: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  heroNumber: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  heroSymbol: { fontSize: 48, fontWeight: "800", color: Colors.textPrimary },
  heroName: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginTop: 4,
  },
  table: {
    borderRadius: 12,
    backgroundColor: Colors.card,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowLabel: { color: Colors.textMuted, fontSize: 13 },
  rowValue: { color: Colors.textPrimary, fontSize: 13, fontWeight: "600" },
});
