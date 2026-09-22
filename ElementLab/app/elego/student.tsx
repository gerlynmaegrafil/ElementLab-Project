// ElementLab/app/elego/student.tsx

import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  getRoomState,
  type BingoCell,
} from "@/lib/elego";
import { getUser } from "@/lib/session";

export default function EleGoStudentScreen() {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [room, setRoom] = useState<EleGoState | null>(null);
  const [card] = useState<BingoCell[]>(() => generateBingoCard());
  const [marked, setMarked] = useState<boolean[]>(() =>
    Array.from({ length: CARD_SIZE * CARD_SIZE }, (_, i) => i === FREE_INDEX)
  );
  const [hasBingo, setHasBingo] = useState(false);
  const [playerName, setPlayerName] = useState("A student");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user?.name) setPlayerName(user.name.split(" ")[0]);
    })();
  }, []);

  const refreshState = useCallback(async (code: string) => {
    try {
      const state = await getRoomState(code);
      setRoom(state);
    } catch {
      // stay on last known state; next poll retries
    }
  }, []);

  useEffect(() => {
    if (!room?.code) return;
    pollRef.current = setInterval(() => refreshState(room.code), 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.code]);

  useEffect(() => {
    if (hasBingo) return;
    if (checkBingo(marked)) {
      setHasBingo(true);
      if (room?.code) {
        announceBingo(room.code, playerName).catch(() => {});
      }
      Alert.alert("🎉 BINGO!", "You completed a line! Show your card to your teacher.");
    }
  }, [marked, hasBingo, room?.code, playerName]);

  const handleJoin = async () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length < 4) {
      setJoinError("Enter the 4-character room code your teacher shared.");
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const state = await getRoomState(code);
      setRoom(state);
    } catch {
      setJoinError("Room not found. Double-check the code and try again.");
    } finally {
      setJoining(false);
    }
  };

  const toggleCell = (index: number, cell: BingoCell) => {
    if (cell.free || hasBingo) return;
    setMarked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const calledSet = new Set(room?.calledNumbers ?? []);
  const currentElement = room?.current ? getElementByNumber(room.current) : null;

  if (!room) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>EleGO — Join</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.joinBody}>
          <Text style={styles.joinLabel}>Enter the room code</Text>
          <TextInput
            value={codeInput}
            onChangeText={(t) => setCodeInput(t.toUpperCase())}
            placeholder="e.g. AB3K"
            placeholderTextColor={Colors.textMuted}
            style={styles.joinInput}
            autoCapitalize="characters"
            maxLength={4}
          />
          {joinError && <Text style={styles.joinError}>{joinError}</Text>}
          <TouchableOpacity
            style={[styles.joinButton, joining && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.joinButtonText}>Join Room</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Room {room.code}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.callBanner}>
          <Text style={styles.callLabel}>NOW CALLING</Text>
          {currentElement ? (
            <Text style={styles.callValue}>
              {currentElement.symbol} — {currentElement.name}
            </Text>
          ) : (
            <Text style={styles.callPlaceholder}>Waiting for the teacher to spin…</Text>
          )}
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
          Tap the box that matches the element being called to shade it in.
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
  joinBody: { paddingHorizontal: 24, marginTop: 40 },
  joinLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 10 },
  joinInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 6,
    textAlign: "center",
    marginBottom: 10,
  },
  joinError: { color: Colors.red, fontSize: 12, marginBottom: 10 },
  joinButton: {
    backgroundColor: Colors.cyan,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  joinButtonDisabled: { opacity: 0.6 },
  joinButtonText: { color: Colors.background, fontSize: 15, fontWeight: "800" },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  callBanner: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 12,
  },
  callLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  callValue: { color: Colors.cyan, fontSize: 17, fontWeight: "800", marginTop: 4 },
  callPlaceholder: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
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