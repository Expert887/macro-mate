export type MotivationStyle = "faith" | "winner" | "mix";

const FAITH = [
  { text: "Todo lo puedo en Cristo que me fortalece.", source: "Filipenses 4:13" },
  { text: "Esfuérzate y sé valiente. No temas, porque el Señor tu Dios estará contigo.", source: "Josué 1:9" },
  { text: "El Señor es mi fuerza y mi escudo; en Él confía mi corazón.", source: "Salmos 28:7" },
  { text: "Los que esperan en el Señor renovarán sus fuerzas.", source: "Isaías 40:31" },
  { text: "Dios no nos dio espíritu de cobardía, sino de poder, amor y dominio propio.", source: "2 Timoteo 1:7" },
  { text: "Encomienda al Señor tus obras y tus pensamientos serán afirmados.", source: "Proverbios 16:3" },
  { text: "Nadie podrá hacerte frente; el Señor estará contigo.", source: "Deuteronomio 31:6" },
  { text: "El que comenzó la buena obra en ti la perfeccionará.", source: "Filipenses 1:6" },
];

const WINNER = [
  { text: "Hoy lo lograrás. Eres un ganador.", source: "Mentalidad 2026" },
  { text: "Disciplina hoy. Resultados mañana.", source: "Élite" },
  { text: "El cuerpo logra lo que la mente cree.", source: "Mentalidad" },
  { text: "Una repetición más. Un día más. Sin excusas.", source: "Performance" },
  { text: "Eres lo que repites. Repite grandeza.", source: "Hábitos" },
  { text: "Nadie te vencerá si tú no te rindes.", source: "Élite" },
  { text: "El progreso silencioso siempre gana.", source: "Mentalidad" },
];

export function pickQuote(style: MotivationStyle = "mix", date = new Date()) {
  const pool = style === "faith" ? FAITH : style === "winner" ? WINNER : [...FAITH, ...WINNER];
  const seed = Number(`${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`);
  return pool[seed % pool.length];
}
