// ElementLab/app/elego/student.tsx
// The card is dealt immediately. The student joins their own class's game
// automatically (matched by their section / class code on the server).

import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";
import { getElementByNumber } from "@/data/elements";
import {
  announceBingo,
  CARD_SIZE,
  checkBingo,
  type EleGoState,
  FREE_INDEX,
  generateBingoCard,
  joinMyRoom,
  type BingoCell,
} from "@/lib/elego";

const freshMarks = () =>
  Array.from({ length: CARD_SIZE * CARD_SIZE }, (_, i) => i === FREE_INDEX);

export default function EleGoStudentScreen() {
  const router = useRouter();

  const [card, setCard] = useState<BingoCell[]>(() => generateBingoCard());
  const [marked, setMarked] = useState<boolean[]>(freshMarks);
  const [hasBingo, setHasBingo] = useState(false);

  const [room, setRoom] = useState<EleGoState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roundRef = useRef<string | null>(null);

  // Keep asking the server for our class's game. This also adds us to the
  // teacher's player list, and keeps working if the teacher opens the game
  // after we tapped START.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await joinMyRoom();
        if (cancelled) return;

        setError(null);
        setRoom(res.room);

        const next = res.room?.roundId ?? null;
        if (next && next !== roundRef.current) {
          // Teacher reset or opened a new game: deal a fresh card.
          if (roundRef.current !== null) {
            setCard(generateBingoCard());
            setMarked(freshMarks());
            setHasBingo(false);
          }
          roundRef.current = next;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Can't reach the server. Retrying…");
        }
      }
    };

    poll();
    const id = setInterval(poll, 2500);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (hasBingo || !checkBingo(marked)) return;
    setHasBingo(true);
    if (room?.code) {
      announceBingo(room.code).catch(() => {});
    }
    Alert.alert("🎉 BINGO!", "You completed a line! Show your card to your teacher.");
  }, [marked, hasBingo, room?.code]);

  const isActive = room?.status === "active";

  const toggleCell = (index: number, cell: BingoCell) => {
    if (cell.free || hasBingo || !isActive) return;
    setMarked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const calledSet = new Set(room?.calledNumbers ?? []);
  const currentElement = room?.current ? getElementByNumber(room.current) : null;

  let bannerLabel = "GAME STATUS";
  let bannerText = "Waiting for your teacher to open the game…";

  if (room?.status === "waiting") {
    bannerText = "You're in! Waiting for your teacher to start…";
  } else if (room?.status === "active") {
    bannerLabel = "NOW CALLING";
    bannerText = currentElement
      ? `${currentElement.symbol} — ${currentElement.name}`
      : "Waiting for the teacher to spin…";
  } else if (room?.status === "ended") {
    bannerText = "This game has ended. Your teacher can open a new one.";
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {room ? `EleGO — ${room.sectionName}` : "EleGO"}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.callBanner}>
          <Text style={styles.callLabel}>{bannerLabel}</Text>
          <Text
            style={
              isActive && currentElement ? styles.callValue : styles.callPlaceholder
            }
          >
            {bannerText}
          </Text>
        </View>

        {hasBingo && (
          <View style={styles.bingoBanner}>
            <Text style={styles.bingoBannerText}>🎉 BINGO! Show your teacher.</Text>
          </View>
        )}

        <View style={styles.grid}>
          {Array.from({ length: CARD_SIZE }, (_, row) => (
            <View key={row} style={styles.gridRow}>
              {card.slice(row * CARD_SIZE, row * CARD_SIZE + CARD_SIZE).map((cell, colIdx) => {
                const index = row * CARD_SIZE + colIdx;
                const isMarked = marked[index];
                const wasCalled = cell.element ? calledSet.has(cell.element.number) : false;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.cell,
                      cell.free && styles.cellFree,
                      isMarked && styles.cellMarked,
                    ]}
                    onPress={() => toggleCell(index, cell)}
                    activeOpacity={0.7}
                  >
                    {cell.free ? (
                      <Text style={styles.cellFreeText}>FREE</Text>
                    ) : (
                      <>
                        <Text style={[styles.cellSymbol, isMarked && styles.cellTextMarked]}>
                          {cell.element!.symbol}
                        </Text>
                        <Text
                          style={[styles.cellName, isMarked && styles.cellTextMarked]}
                          numberOfLines={1}
                        >
                          {cell.element!.name}
                        </Text>
                        {wasCalled && !isMarked && <View style={styles.calledDot} />}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={styles.hint}>
          {isActive
            ? "Tap the box that matches the element being called to shade it in."
            : "You can start shading once your teacher starts the game."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  backText: { color: Colors.textPrimary, fontSize: 26, fontWeight: "600" },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: "800" },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  errorBanner: {
    backgroundColor: "rgba(242,109,109,0.12)",
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: Colors.red, fontSize: 12 },
  callBanner: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  callLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  callValue: { color: Colors.cyan, fontSize: 17, fontWeight: "800", marginTop: 4 },
  callPlaceholder: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  bingoBanner: {
    backgroundColor: "rgba(61,220,151,0.12)",
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bingoBannerText: { color: Colors.green, fontSize: 13, fontWeight: "700", textAlign: "center" },
  grid: { gap: 6 },
  gridRow: { flexDirection: "row", gap: 6 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  cellFree: { backgroundColor: Colors.cardAlt },
  cellMarked: { backgroundColor: Colors.cyan, borderColor: Colors.cyan },
  cellFreeText: { color: Colors.textMuted, fontSize: 10, fontWeight: "700" },
  cellSymbol: { color: Colors.textPrimary, fontSize: 14, fontWeight: "800" },
  cellName: { color: Colors.textMuted, fontSize: 7, fontWeight: "600", marginTop: 1 },
  cellTextMarked: { color: Colors.background },
  calledDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.yellow,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 14,
  },
});