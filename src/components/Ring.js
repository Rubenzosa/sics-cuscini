import React from "react";

export default function Ring({ giorni, stato }) {
  const size = 52, r = 20, circ = 2 * Math.PI * r;
  let pct = 1, color = "#639922";
  if (stato === "scaduto")         { pct = 0;    color = "#e24b4a"; }
  else if (stato === "critico")    { pct = 0.08; color = "#e24b4a"; }
  else if (stato === "attenzione") { pct = 0.35; color = "#ba7517"; }
  else if (stato === "buono")      { pct = 0.70; color = "#639922"; }
  else if (stato === "regolare")   { pct = 1;    color = "#639922"; }
  else { pct = 0.5; color = "#888"; }
  const offset = circ * (1 - pct);
  const abs = Math.abs(giorni ?? 0);
  const label = giorni === null ? "N/D" : giorni < 0 ? `${abs}\nfa` : giorni > 999 ? "OK" : giorni > 99 ? `${giorni}\ngg` : `${giorni}g`;
  const lines = label.split("\n");
  const fs = abs > 99 ? 8 : 10;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle fill="none" stroke="var(--border)" strokeWidth="3.5" cx={size/2} cy={size/2} r={r} />
        <circle fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" cx={size/2} cy={size/2} r={r} strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
        {lines.map((l, i) => <span key={i} style={{ fontSize: fs, fontWeight: 800, color }}>{l}</span>)}
      </div>
    </div>
  );
}
