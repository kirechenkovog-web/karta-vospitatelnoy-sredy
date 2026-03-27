import type { NoteItem } from "@/types";

export function getScoreColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#eab308";
  return "#ef4444";
}

export function parseSavedNotes(tenOfTenText: string | null | undefined): NoteItem[] {
  if (!tenOfTenText) return [];
  try {
    const parsed = JSON.parse(tenOfTenText);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseJsonMap(s: string | null): Record<string, string> {
  if (!s) return {};
  try {
    const p = JSON.parse(s);
    return typeof p === "object" && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
}
