import { ELEMENTS, type ElementData } from "@/data/elements";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/session";

export const CARD_SIZE = 5;
export const FREE_INDEX = Math.floor((CARD_SIZE * CARD_SIZE) / 2);

export type BingoCell = {
  element: ElementData | null;
  free: boolean;
};

export function generateBingoCard(): BingoCell[] {
  const shuffled = [...ELEMENTS].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, CARD_SIZE * CARD_SIZE - 1);

  const cells: BingoCell[] = [];
  let pickIndex = 0;

  for (let i = 0; i < CARD_SIZE * CARD_SIZE; i++) {
    if (i === FREE_INDEX) {
      cells.push({ element: null, free: true });
    } else {
      cells.push({ element: picks[pickIndex], free: false });
      pickIndex++;
    }
  }

  return cells;
}

export function checkBingo(marked: boolean[]): boolean {
  const n = CARD_SIZE;
  const at = (r: number, c: number) => marked[r * n + c];

  for (let r = 0; r < n; r++) {
    if (Array.from({ length: n }, (_, c) => at(r, c)).every(Boolean)) return true;
  }

  for (let c = 0; c < n; c++) {
    if (Array.from({ length: n }, (_, r) => at(r, c)).every(Boolean)) return true;
  }

  if (Array.from({ length: n }, (_, i) => at(i, i)).every(Boolean)) return true;

  if (Array.from({ length: n }, (_, i) => at(i, n - 1 - i)).every(Boolean)) return true;

  return false;
}

export type EleGoStatus = "waiting" | "active" | "ended";

export type EleGoStudent = {
  id: string;
  name: string;
  joinedAt?: number;
};

export type EleGoState = {
  code: string; // the teacher's class code
  sectionName: string;
  status: EleGoStatus;
  current: number | null;
  calledNumbers: number[];
  remainingCount: number;
  studentCount: number;
  students: EleGoStudent[];
  lastBingoBy?: string | null;
  roundId: string;
  updatedAt: number;
};

export type ClassSection = {
  _id: string;
  name: string;
  code: string;
  studentCount: number;
};

async function authedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

const request = <T>(path: string, options?: RequestInit) =>
  authedFetch<T>(`${API_BASE_URL}/api/elego${path}`, options);

/* =========================
   TEACHER
========================= */

export function getMySections() {
  return authedFetch<ClassSection[]>(`${API_BASE_URL}/api/sections/mine`);
}

export function createRoom(sectionId: string) {
  return request<EleGoState>("/create", {
    method: "POST",
    body: JSON.stringify({ sectionId }),
  });
}

export function getRoomState(code: string) {
  return request<EleGoState>(`/state/${code.toUpperCase()}`);
}

export function startRoom(code: string) {
  return request<EleGoState>("/start", {
    method: "POST",
    body: JSON.stringify({ code: code.toUpperCase() }),
  });
}

export function spinRoom(code: string) {
  return request<EleGoState>("/spin", {
    method: "POST",
    body: JSON.stringify({ code: code.toUpperCase() }),
  });
}

export function resetRoom(code: string) {
  return request<EleGoState>("/reset", {
    method: "POST",
    body: JSON.stringify({ code: code.toUpperCase() }),
  });
}

export function endRoom(code: string) {
  return request<EleGoState>("/end", {
    method: "POST",
    body: JSON.stringify({ code: code.toUpperCase() }),
  });
}

/* =========================
   STUDENT
========================= */

// Joins the room of the student's own class. Returns { room: null }
// until the teacher opens a game. Safe to call repeatedly.
export function joinMyRoom() {
  return request<{ room: EleGoState | null; studentId?: string }>("/join", {
    method: "POST",
  });
}

export function announceBingo(code: string) {
  return request<EleGoState>("/bingo", {
    method: "POST",
    body: JSON.stringify({ code: code.toUpperCase() }),
  });
}