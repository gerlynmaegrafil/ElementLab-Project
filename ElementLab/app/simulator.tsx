import PickerField from "@/components/PickerField";
import SelectModal, { SelectOption } from "@/components/SelectModal";
import { Colors } from "@/constants/theme-colors";
import { findReaction, Reaction } from "@/data/reactions";
import { ELEMENTS, ElementData } from "@/data/elements";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const OPTIONS: SelectOption[] = ELEMENTS.map((e) => ({
  code: e.symbol,
  name: `${e.name} (${e.symbol})`,
  subtitle: `#${e.number}`,
}));

export default function SimulatorScreen() {
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

  // 4.1 - both elements selected, ready to simulate
  const readyToSimulate = elA !== null && elB !== null;

  // 4.2 - validate whether the combination has a supported reaction
  const reaction: Reaction | undefined = readyToSimulate
    ? findReaction(elA!.symbol, elB!.symbol)
    : undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Reaction Simulator</Text>
      <Text style={styles.subtitle}>
        Select two elements to see if they react.
      </Text>

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

      {/* 4.3, 4.4, 4.5 - simulate & display the resulting interaction */}
      {readyToSimulate && reaction && (
        <View style={styles.resultCard}>
          <Text style={styles.resultBadge}>Reaction Supported</Text>
          <Text style={styles.equation}>{reaction.equation}</Text>
          <Text style={styles.productName}>{reaction.productName}</Text>
          <Text style={styles.description}>{reaction.description}</Text>
        </View>
      )}

      {/* 4.6 - inform the user when there's no supported reaction */}
      {readyToSimulate && !reaction && (
        <View style={[styles.resultCard, styles.noReactionCard]}>
          <Text style={styles.noReactionBadge}>No Supported Reaction</Text>
          <Text style={styles.noReactionText}>
            {elA!.name} ({elA!.symbol}) and {elB!.name} ({elB!.symbol}) do not
            have a reaction available in this simulator yet. Try a different
            combination — common reactive pairs involve metals with oxygen,
            or metals with halogens like chlorine.
          </Text>
        </View>
      )}

      {!readyToSimulate && (
        <Text style={styles.hint}>
          Choose Element A and Element B above to run the simulation.
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 18,
  },
  pickersRow: { flexDirection: "row", marginBottom: 16 },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  resultBadge: {
    color: Colors.green,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  equation: {
    color: Colors.cyan,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  productName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  noReactionCard: {
    borderColor: Colors.red,
  },
  noReactionBadge: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  noReactionText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 20,
    textAlign: "center",
  },
});