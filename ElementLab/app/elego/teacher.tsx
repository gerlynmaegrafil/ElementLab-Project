// ElementLab/app/elego/teacher.tsx

import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme-colors";
import { getElementByNumber } from "@/data/elements";
import {
  createRoom,
  endRoom,
  type EleGoState,
  getRoomState,
  resetRoom,
  spinRoom,
  startRoom,
} from "@/lib/elego";

export default function EleGoTeacherScreen() {
  const router = useRouter();

  const [room, setRoom] = useState<EleGoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* =========================
     REFRESH ROOM
  ========================= */

  const refreshState = useCallback(async (code: string) => {
    try {
      const state = await getRoomState(code);
      setRoom(state);
      setError(null);
    } catch {
      // Keep the last known state.
    }
  }, []);

  /* =========================
     CREATE ROOM
  ========================= */

  useEffect(() => {
    (async () => {
      try {
        const created = await createRoom();
        setRoom(created);
      } catch {
        setError(
          "Couldn't reach the ElementLab server. Make sure the backend is running and reachable."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* =========================
     POLLING
  ========================= */

  useEffect(() => {
    if (!room?.code) return;

    pollRef.current = setInterval(() => {
      refreshState(room.code);
    }, 2000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [room?.code, refreshState]);

  /* =========================
     START GAME
  ========================= */

  const handleStart = async () => {
    if (!room) return;

    if (room.studentCount === 0) {
      Alert.alert(
        "No students yet",
        "Wait for at least one student to join before starting the game."
      );
      return;
    }

    setStarting(true);

    try {
      const next = await startRoom(room.code);
      setRoom(next);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't start the game."
      );
    } finally {
      setStarting(false);
    }
  };

  /* =========================
     SPIN
  ========================= */

  const handleSpin = async () => {
    if (!room || room.status !== "active") return;

    setSpinning(true);

    try {
      const next = await spinRoom(room.code);
      setRoom(next);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Spin failed — check your connection and try again."
      );
    } finally {
      setSpinning(false);
    }
  };

  /* =========================
     RESET
  ========================= */

  const handleReset = async () => {
    if (!room) return;

    Alert.alert(
      "Reset game?",
      "This clears all called elements for everyone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const next = await resetRoom(room.code);
              setRoom(next);
              setError(null);
            } catch {
              setError("Reset failed — check your connection.");
            }
          },
        },
      ]
    );
  };

  /* =========================
     END GAME
  ========================= */

  const handleEnd = async () => {
    if (!room) return;

    Alert.alert(
      "End game?",
      "Students will no longer be able to continue this game.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "End Game",
          style: "destructive",
          onPress: async () => {
            try {
              const next = await endRoom(room.code);
              setRoom(next);
              setError(null);
            } catch {
              setError(
                "Couldn't end the game — check your connection."
              );
            }
          },
        },
      ]
    );
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.cyan} size="large" />

        <Text style={styles.loadingText}>
          Creating game room…
        </Text>
      </SafeAreaView>
    );
  }

  const currentElement = room?.current
    ? getElementByNumber(room.current)
    : null;

  const isWaiting = room?.status === "waiting";
  const isActive = room?.status === "active";
  const isEnded = room?.status === "ended";

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>EleGO — Teacher</Text>

        <View style={styles.backBtn} />
      </View>

      {/* ERROR */}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {room && (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {/* =========================
              ROOM CODE
          ========================= */}

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>
              GAME CODE
            </Text>

            <Text style={styles.codeValue}>
              {room.code}
            </Text>

            <Text style={styles.shareText}>
              Share this code with your students
            </Text>

            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  isActive && styles.statusDotActive,
                  isEnded && styles.statusDotEnded,
                ]}
              />

              <Text style={styles.statusPillText}>
                {room.status === "waiting"
                  ? "WAITING FOR STUDENTS"
                  : room.status === "active"
                  ? "GAME IN PROGRESS"
                  : "GAME ENDED"}
              </Text>
            </View>
          </View>

          {/* =========================
              LOBBY
          ========================= */}

          {isWaiting && (
            <View style={styles.lobbyCard}>
              <View style={styles.lobbyHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Players
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Students who join will appear here
                  </Text>
                </View>

                <View style={styles.playerCount}>
                  <Text style={styles.playerCountNumber}>
                    {room.studentCount}
                  </Text>

                  <Text style={styles.playerCountLabel}>
                    joined
                  </Text>
                </View>
              </View>

              {room.students.length === 0 ? (
                <View style={styles.emptyLobby}>
                  <Text style={styles.emptyLobbyIcon}>
                    👥
                  </Text>

                  <Text style={styles.emptyLobbyTitle}>
                    Waiting for students
                  </Text>

                  <Text style={styles.emptyLobbyText}>
                    Ask your students to open EleGO and enter
                    the game code above.
                  </Text>
                </View>
              ) : (
                <View style={styles.studentList}>
                  {room.students.map((student, index) => (
                    <View
                      key={student.id}
                      style={styles.studentRow}
                    >
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {student.name
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {student.name}
                        </Text>

                        <Text style={styles.studentJoined}>
                          Player {index + 1}
                        </Text>
                      </View>

                      <Text style={styles.joinedCheck}>
                        ✓
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* START BUTTON */}

              <TouchableOpacity
                style={[
                  styles.startButton,
                  room.studentCount === 0 &&
                    styles.startButtonDisabled,
                ]}
                onPress={handleStart}
                disabled={
                  starting || room.studentCount === 0
                }
              >
                {starting ? (
                  <ActivityIndicator
                    color={Colors.background}
                  />
                ) : (
                  <Text style={styles.startButtonText}>
                    ▶ START GAME
                  </Text>
                )}
              </TouchableOpacity>

              {room.studentCount === 0 && (
                <Text style={styles.startHint}>
                  At least one student must join first.
                </Text>
              )}
            </View>
          )}

          {/* =========================
              CURRENT ELEMENT
          ========================= */}

          {(isActive || isEnded) && (
            <>
              <View style={styles.currentCard}>
                <Text style={styles.currentLabel}>
                  NOW CALLING
                </Text>

                {currentElement ? (
                  <>
                    <Text style={styles.currentSymbol}>
                      {currentElement.symbol}
                    </Text>

                    <Text style={styles.currentName}>
                      {currentElement.name}
                    </Text>

                    <Text style={styles.currentNumber}>
                      Element #{currentElement.atomicNumber}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.currentPlaceholder}>
                    Ready for the first spin
                  </Text>
                )}
              </View>

              {/* SPIN */}

              {isActive && (
                <TouchableOpacity
                  style={[
                    styles.spinButton,
                    spinning &&
                      styles.spinButtonDisabled,
                  ]}
                  onPress={handleSpin}
                  disabled={spinning}
                >
                  {spinning ? (
                    <ActivityIndicator
                      color={Colors.background}
                    />
                  ) : (
                    <Text style={styles.spinButtonText}>
                      🎯 SPIN
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {/* =========================
              PLAYER COUNT DURING GAME
          ========================= */}

          {(isActive || isEnded) && (
            <View style={styles.playersMiniCard}>
              <View>
                <Text style={styles.playersMiniTitle}>
                  Players
                </Text>

                <Text style={styles.playersMiniSubtitle}>
                  {room.studentCount} student
                  {room.studentCount !== 1 ? "s" : ""} joined
                </Text>
              </View>

              <View style={styles.playersMiniNumber}>
                <Text style={styles.playersMiniNumberText}>
                  {room.studentCount}
                </Text>
              </View>
            </View>
          )}

          {/* =========================
              BINGO WINNER
          ========================= */}

          {room.lastBingoBy && (
            <View style={styles.bingoBanner}>
              <Text style={styles.bingoEmoji}>
                🎉
              </Text>

              <View style={styles.bingoContent}>
                <Text style={styles.bingoTitle}>
                  BINGO!
                </Text>

                <Text style={styles.bingoBannerText}>
                  {room.lastBingoBy} called BINGO!
                </Text>
              </View>
            </View>
          )}

          {/* =========================
              CALLED ELEMENTS
          ========================= */}

          {(isActive || isEnded) && (
            <>
              <Text style={styles.calledLabel}>
                Called Elements ({room.calledNumbers.length})
              </Text>

              <View style={styles.chipRow}>
                {room.calledNumbers.length === 0 && (
                  <Text style={styles.emptyText}>
                    Nothing called yet.
                  </Text>
                )}

                {room.calledNumbers
                  .slice()
                  .reverse()
                  .map((num) => {
                    const el = getElementByNumber(num);

                    return (
                      <View
                        key={num}
                        style={styles.chip}
                      >
                        <Text style={styles.chipSymbol}>
                          {el?.symbol}
                        </Text>

                        <Text style={styles.chipNumber}>
                          {num}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </>
          )}

          {/* =========================
              ACTIONS
          ========================= */}

          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReset}
            >
              <Text style={styles.secondaryButtonText}>
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleEnd}
            >
              <Text style={styles.dangerButtonText}>
                End Game
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: "600",
  },

  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },

  errorBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "rgba(242,109,109,0.12)",
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 10,
    padding: 10,
  },

  errorText: {
    color: Colors.red,
    fontSize: 12,
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* ROOM */

  codeCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  codeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  codeValue: {
    color: Colors.cyan,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 7,
    marginTop: 5,
  },

  shareText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.yellow,
    marginRight: 7,
  },

  statusDotActive: {
    backgroundColor: Colors.green,
  },

  statusDotEnded: {
    backgroundColor: Colors.red,
  },

  statusPillText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* LOBBY */

  lobbyCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  lobbyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  playerCount: {
    minWidth: 55,
    alignItems: "center",
    backgroundColor: Colors.cyanSoft,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },

  playerCountNumber: {
    color: Colors.cyan,
    fontSize: 19,
    fontWeight: "900",
  },

  playerCountLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: "700",
  },

  emptyLobby: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 14,
    marginBottom: 14,
  },

  emptyLobbyIcon: {
    fontSize: 30,
    marginBottom: 8,
  },

  emptyLobbyTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },

  emptyLobbyText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 5,
  },

  studentList: {
    marginBottom: 14,
  },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },

  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  studentAvatarText: {
    color: Colors.cyan,
    fontSize: 15,
    fontWeight: "900",
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },

  studentJoined: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  joinedCheck: {
    color: Colors.green,
    fontSize: 18,
    fontWeight: "900",
  },

  startButton: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  startButtonDisabled: {
    opacity: 0.35,
  },

  startButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: "900",
  },

  startHint: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 8,
  },

  /* CURRENT */

  currentCard: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 16,
  },

  currentLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },

  currentSymbol: {
    color: Colors.textPrimary,
    fontSize: 52,
    fontWeight: "900",
  },

  currentName: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },

  currentNumber: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 5,
  },

  currentPlaceholder: {
    color: Colors.textMuted,
    fontSize: 14,
    paddingVertical: 12,
  },

  /* SPIN */

  spinButton: {
    backgroundColor: Colors.cyan,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },

  spinButtonDisabled: {
    opacity: 0.6,
  },

  spinButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "900",
  },

  /* PLAYERS */

  playersMiniCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },

  playersMiniTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },

  playersMiniSubtitle: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  playersMiniNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.cyanSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  playersMiniNumberText: {
    color: Colors.cyan,
    fontSize: 17,
    fontWeight: "900",
  },

  /* BINGO */

  bingoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(61,220,151,0.12)",
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
  },

  bingoEmoji: {
    fontSize: 25,
    marginRight: 10,
  },

  bingoContent: {
    flex: 1,
  },

  bingoTitle: {
    color: Colors.green,
    fontSize: 13,
    fontWeight: "900",
  },

  bingoBannerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  /* CALLED */

  calledLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
  },

  chip: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  chipSymbol: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },

  chipNumber: {
    color: Colors.textMuted,
    fontSize: 8,
    marginTop: 2,
  },

  /* FOOTER */

  footerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.cardAlt,
  },

  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },

  dangerButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  dangerButtonText: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: "700",
  },
});