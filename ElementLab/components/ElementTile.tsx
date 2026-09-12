import { categoryColor } from "@/constants/element-colors";
import { Colors } from "@/constants/theme-colors";
import { ElementData } from "@/data/elements";
import { Pressable, StyleSheet, Text } from "react-native";

export const TILE_SIZE = 52;
export const TILE_GAP = 4;

type Props = {
  element: ElementData;
  onPress: (el: ElementData) => void;
  highlightColor?: string | null;
  dimmed?: boolean;
};

export default function ElementTile({
  element,
  onPress,
  highlightColor,
  dimmed,
}: Props) {
  const bg = highlightColor ?? categoryColor(element.category);
  return (
    <Pressable
      onPress={() => onPress(element)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: bg, opacity: dimmed ? 0.25 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={styles.number}>{element.number}</Text>
      <Text style={styles.symbol}>{element.symbol}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {element.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 8,
    margin: TILE_GAP / 2,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  number: {
    position: "absolute",
    top: 3,
    left: 5,
    fontSize: 8,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  symbol: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  name: {
    fontSize: 7,
    color: "rgba(255,255,255,0.85)",
    maxWidth: TILE_SIZE - 6,
  },
});
