export const SLOT_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  media_manana: "Media mañana",
  almuerzo: "Almuerzo",
  snack: "Snack",
  cena: "Cena",
  otro: "Otro",
};

export const SLOT_ORDER = ["desayuno", "media_manana", "almuerzo", "snack", "cena", "otro"];

export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcAge(birth: string | Date): number {
  const b = new Date(birth);
  const d = new Date();
  let a = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) a--;
  return a;
}

export function bmrMifflin(p: { sex: Sex; weightKg: number; heightCm: number; age: number }) {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

export function tdee(bmr: number, activity: Activity) {
  return bmr * ACTIVITY_FACTOR[activity];
}

export function macroTargets(p: {
  sex: Sex; weightKg: number; heightCm: number; age: number;
  activity: Activity; goal: Goal;
}) {
  const bmr = bmrMifflin(p);
  const maintenance = tdee(bmr, p.activity);
  const kcal = Math.round(
    p.goal === "lose" ? maintenance - 400 :
    p.goal === "gain" ? maintenance + 300 : maintenance
  );
  const proteinPerKg = p.goal === "gain" ? 2.0 : p.goal === "lose" ? 2.2 : 1.8;
  const protein = Math.round(p.weightKg * proteinPerKg);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}
