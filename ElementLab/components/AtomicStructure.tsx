import { Colors } from "@/constants/theme-colors";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  shells: number[];
  protons: number;
  neutrons: number | null;
  symbol: string;
};

const RING_GAP = 26;
const NUCLEUS_SIZE = 44;
const ELECTRON_SIZE = 8;

// 3.2 - visual representation of the selected element's atomic structure
export default function AtomicStructure({
  shells,
  protons,
  neutrons,
  symbol,
}: Props) {
  const size = NUCLEUS_SIZE + shells.length * RING_GAP * 2 + 20;
  const center = size / 2;

  const rings = useMemo(() => {
    return shells.map((count, shellIndex) => {
      const radius = NUCLEUS_SIZE / 2 + (shellIndex + 1) * RING_GAP;
      const electrons = Array.from({ length: count }).map((_, i) => {
        const angle = (2 * Math.PI * i) / count - Math.PI / 2;
        const x = center + radius * Math.cos(angle) - ELECTRON_SIZE / 2;
        const y = center + radius * Math.sin(angle) - ELECTRON_SIZE / 2;
        return { x, y, key: `${shellIndex}-${i}` };
      });
      return { radius, electrons, key: `shell-${shellIndex}` };
    });
  }, [shells, center]);

  const totalElectrons = shells.reduce((a, b) => a + b, 0);

  return (
    <View style={styles.outer}>
      <View style={[styles.diagram, { width: size, height: size }]}>
        {rings.map((ring) => (
          <View
            key={ring.key}
            style={[
              styles.ring,
              {
                width: ring.radius * 2,
                height: ring.radius * 2,
                borderRadius: ring.radius,
                left: center - ring.radius,
                top: center - ring.radius,
              },
            ]}
          />
        ))}

        {rings.map((ring) =>
          ring.electrons.map((e) => (
            <View
              key={e.key}
              style={[styles.electron, { left: e.x, top: e.y }]}
            />
          )),
        )}

        <View
          style={[
            styles.nucleus,
            {
              width: NUCLEUS_SIZE,
              height: NUCLEUS_SIZE,
              borderRadius: NUCLEUS_SIZE / 2,
              left: center - NUCLEUS_SIZE / 2,
              top: center - NUCLEUS_SIZE / 2,
            },
          ]}
        >
          <Text style={styles.nucleusSymbol}>{symbol}</Text>
        </View>
      </View>

      <Text style={styles.caption}>
        p⁺ {protons} · n⁰ {neutrons ?? "—"} · e⁻ {totalElectrons}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: "center",
    marginVertical: 14,
  },
  diagram: {
    position: "relative",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  electron: {
    position: "absolute",
    width: ELECTRON_SIZE,
    height: ELECTRON_SIZE,
    borderRadius: ELECTRON_SIZE / 2,
    backgroundColor: Colors.cyan,
  },
  nucleus: {
    position: "absolute",
    backgroundColor: Colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  nucleusSymbol: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.background,
  },
  caption: {
    marginTop: 8,
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
  },
});