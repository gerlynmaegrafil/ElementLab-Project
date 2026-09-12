import { categoryColors, categoryLabels } from "@/constants/element-colors";
import { Colors } from "@/constants/theme-colors";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function CategoryLegend() {
  const entries = Object.keys(categoryColors).filter((k) => k !== "unknown");
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
    >
      {entries.map((key) => (
        <View key={key} style={styles.item}>
          <View
            style={[styles.dot, { backgroundColor: categoryColors[key] }]}
          />
          <Text style={styles.label}>{categoryLabels[key]}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 0, marginBottom: 4 },
  item: { flexDirection: "row", alignItems: "center", marginRight: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  label: { fontSize: 12, color: Colors.textMuted },
});
