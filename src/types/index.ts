export interface NoteItem {
  type: "heading" | "bullet" | "quote";
  text: string;
}

export interface AspectScore {
  aspectCode: string;
  score: number | null;
  tenOfTenText: string | null;
  currentStateText: string | null;
  status: string;
}

export interface DeepDive {
  aspectCode: string;
  resultsText: string | null;
  resourcesText: string | null;
  challengesText: string | null;
  indicatorsText: string | null;
}

export interface FocusPlan {
  focusAspects: string;
  targetResult: string | null;
  crossResourcesText: string | null;
  firstStepsText: string | null;
}
