import PickerField from "@/components/PickerField";
import SelectModal, { SelectOption } from "@/components/SelectModal";
import { categoryLabels } from "@/constants/element-colors";
import { Colors } from "@/constants/theme-colors";
import { ELEMENTS, ElementData, kelvinToCelsius } from "@/data/elements";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const OPTIONS: SelectOption[] = ELEMENTS.map((e) => ({
  code: e.symbol,
  name: `${e.name} (${e.symbol})`,
  subtitle: `#${e.number}`,
}));

type RowDef = {
  label: string;
  get: (e: ElementData) => string;
  raw: (e: ElementData) => string | number | null;
};

const ROWS: RowDef[] = [
  { label: "Atomic number", get: (e) => String(e.number), raw: (e) => e.number },
  {
    label: "Atomic mass",
    get: (e) => (e.mass !== null ? `${e.mass} u` : "—"),
    raw: (e) => e.mass,
  },
  {
    label: "Category",
    get: (e) => categoryLabels[e.category] ?? e.category,
    raw: (e) => e.category,
  },
  { label: "Period", get: (e) => String(e.period), raw: (e) => e.period },
  {
    label: "Group",
    get: (e) => (e.group !== null ? String(e.group) : "—"),
    raw: (e) => e.group,
  },
  { label: "Phase", get: (e) => e.phase ?? "—", raw: (e) => e.phase },
  { label: "Protons", get: (e) => String(e.protons), raw: (e) => e.protons },
  {
    label: "Neutrons",
    get: (e) => (e.neutrons !== null ? String(e.neutrons) : "—"),
    raw: (e) => e.neutrons,
  },
  { label: "Electrons", get: (e) => String(e.electrons), raw: (e) => e.electrons },
  {
    label: "Electronegativity",
    get: (e) =>
      e.electronegativity !== null ? String(e.electronegativity) : "—",
    raw: (e) => e.electronegativity,
  },
  {
    label: "Density",
    get: (e) => (e.density !== null ? `${e.density} g/cm³` : "—"),
    raw: (e) => e.density,
  },
  {
    label: "Melting point",
    get: (e) => {
      const c = kelvinToCelsius(e.meltK);
      return c !== null ? `${c} °C` : "—";
    },
    raw: (e) => kelvinToCelsius(e.meltK),
  },
  {
    label: "Boiling point",
    get: (e) => {
      const c = kelvinToCelsius(e.boilK);
      return c !== null ? `${c} °C` : "—";
    },
    raw: (e) => kelvinToCelsius(e.boilK),
  },
];

export default function CompareScreen() {
  const router = useRouter();
  const [elA, setElA] = useState<ElementData | null>(null);
  const [elB, setElB] = useState<ElementData | null>(null);
  const [pickerOpen, setPickerOpen] = useState<"A" | "B" | null>(null);

  const handleSelect = (opt: SelectOption) => {
    const el = ELEMENTS.find((e) => e.symbol === opt.code) ?? null;
    if (pickerOpen === "A") setElA(el);
    if (pickerOpen === "B") setElB(el);
    setPickerOpen(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Compare Elements</Text>

      {/* 3.3 - select two elements for comparison */}
      <View style={styles.pickersRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.pickerLabel}>Element A</Text>
          <PickerField
            placeholder="Select element"
            value={elA ? `${elA.name} (${elA.symbol})` : undefined}
            onPress={() => setPickerOpen("A")}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.pickerLabel}>Element B</Text>
          <PickerField
            placeholder="Select element"
            value={elB ? `${elB.name} (${elB.symbol})` : undefined}
            onPress={() => setPickerOpen("B")}
          />
        </View>
      </View>

      {/* 3.4 - display and highlight similarities/differences */}
      {elA && elB ? (
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCell, { flex: 1.2 }]}>Property</Text>
            <Text style={[styles.headerCell, styles.centerText]}>
              {elA.symbol}
            </Text>
            <Text style={[styles.headerCell, styles.centerText]}>
              {elB.symbol}
            </Text>
          </View>
          {ROWS.map((row) => {
            const va = row.raw(elA);
            const vb = row.raw(elB);
            const same = va !== null && vb !== null && va === vb;
            return (
              <View key={row.label} style={styles.tableRow}>
                <Text style={[styles.cellLabel, { flex: 1.2 }]}>
                  {row.label}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.centerText,
                    same ? styles.sameValue : styles.diffValue,
                  ]}
                >
                  {row.get(elA)}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.centerText,
                    same ? styles.sameValue : styles.diffValue,
                  ]}
                >
                  {row.get(elB)}
                </Text>
              </View>
            );
          })}
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: Colors.green }]} />
            <Text style={styles.legendText}>Same value</Text>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: Colors.yellow, marginLeft: 16 },
              ]}
            />
            <Text style={styles.legendText}>Different value</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>
          Select two elements above to compare their properties.
        </Text>
      )}

      <SelectModal
        visible={pickerOpen !== null}
        title={pickerOpen === "A" ? "Select Element A" : "Select Element B"}
        options={OPTIONS}
        onSelect={handleSelect}
        onClose={() => setPickerOpen(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: { marginBottom: 8 },
  backText: { color: Colors.textMuted, fontSize: 14, fontWeight: "600" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  pickersRow: { flexDirection: "row", marginBottom: 8 },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  table: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginTop: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: Colors.cardAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerCell: {
    flex: 1,
    color: Colors.cyan,
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  cellLabel: { flex: 1, color: Colors.textMuted, fontSize: 12 },
  cell: { flex: 1, fontSize: 13, fontWeight: "600" },
  centerText: { textAlign: "center" },
  sameValue: { color: Colors.green },
  diffValue: { color: Colors.yellow },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 11, color: Colors.textMuted },
  hint: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 20,
    textAlign: "center",
  },
});