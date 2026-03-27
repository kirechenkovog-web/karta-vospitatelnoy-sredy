interface IconProps { color: string; size?: number; }

export function ResultsIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <polyline points="1,11 5,7 9,9 15,3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="11,3 15,3 15,7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ResourcesIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth="1.8"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M11.53 4.47l1.42-1.42M3.05 12.95l1.42-1.42" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function ChallengesIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M8 1.5L1 14h14L8 1.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="8" y1="6.5" x2="8" y2="9.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="11.5" r="0.8" fill={color}/>
    </svg>
  );
}

export function IndicatorsIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.8"/>
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="1" fill={color}/>
    </svg>
  );
}

export type FieldKey = "resultsText" | "resourcesText" | "challengesText" | "indicatorsText";

export function FieldIcon({ fieldKey, color, size = 16 }: { fieldKey: FieldKey; color: string; size?: number }) {
  switch (fieldKey) {
    case "resultsText": return <ResultsIcon color={color} size={size} />;
    case "resourcesText": return <ResourcesIcon color={color} size={size} />;
    case "challengesText": return <ChallengesIcon color={color} size={size} />;
    case "indicatorsText": return <IndicatorsIcon color={color} size={size} />;
  }
}

export const DEEP_FIELDS: { key: FieldKey; label: string; color: string }[] = [
  { key: "resultsText", label: "Результаты", color: "#22c55e" },
  { key: "resourcesText", label: "Ресурсы", color: "#4F46E5" },
  { key: "challengesText", label: "Вызовы", color: "#ef4444" },
  { key: "indicatorsText", label: "Индикаторы достижения цели", color: "#f59e0b" },
];
