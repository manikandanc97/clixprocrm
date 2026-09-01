export interface LetterColorStyle {
  bg: string;
  text: string;
  border: string;
}

export const LETTER_COLORS: Record<string, LetterColorStyle> = {
  A: { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  B: { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  C: { bg: "bg-cyan-500/10 dark:bg-cyan-500/20", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/20" },
  D: { bg: "bg-slate-500/10 dark:bg-slate-500/20", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20" },
  E: { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  F: { bg: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20", text: "text-fuchsia-600 dark:text-fuchsia-400", border: "border-fuchsia-500/20" },
  G: { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-600 dark:text-green-400", border: "border-green-500/20" },
  H: { bg: "bg-rose-500/10 dark:bg-rose-500/20", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" },
  I: { bg: "bg-indigo-500/10 dark:bg-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
  J: { bg: "bg-teal-500/10 dark:bg-teal-500/20", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20" },
  K: { bg: "bg-yellow-500/10 dark:bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-500/20" },
  L: { bg: "bg-lime-500/10 dark:bg-lime-500/20", text: "text-lime-600 dark:text-lime-400", border: "border-lime-500/20" },
  M: { bg: "bg-pink-500/10 dark:bg-pink-500/20", text: "text-pink-600 dark:text-pink-400", border: "border-pink-500/20" },
  N: { bg: "bg-sky-500/10 dark:bg-sky-500/20", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500/20" },
  O: { bg: "bg-orange-500/10 dark:bg-orange-500/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20" },
  P: { bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  Q: { bg: "bg-violet-500/10 dark:bg-violet-500/20", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20" },
  R: { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400", border: "border-red-500/20" },
  S: { bg: "bg-amber-600/10 dark:bg-amber-600/20", text: "text-amber-700 dark:text-amber-300", border: "border-amber-600/20" },
  T: { bg: "bg-rose-400/10 dark:bg-rose-400/20", text: "text-rose-500 dark:text-rose-300", border: "border-rose-400/20" },
  U: { bg: "bg-blue-600/10 dark:bg-blue-600/20", text: "text-blue-700 dark:text-blue-300", border: "border-blue-600/20" },
  V: { bg: "bg-violet-600/10 dark:bg-violet-600/20", text: "text-violet-700 dark:text-violet-300", border: "border-violet-600/20" },
  W: { bg: "bg-fuchsia-600/10 dark:bg-fuchsia-600/20", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-600/20" },
  X: { bg: "bg-emerald-600/10 dark:bg-emerald-600/20", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-600/20" },
  Y: { bg: "bg-teal-600/10 dark:bg-teal-600/20", text: "text-teal-700 dark:text-teal-300", border: "border-teal-600/20" },
  Z: { bg: "bg-zinc-500/10 dark:bg-zinc-500/20", text: "text-zinc-600 dark:text-zinc-400", border: "border-zinc-500/20" },
};

export const getOrgAvatarColor = (name?: string | null): LetterColorStyle => {
  if (!name || typeof name !== "string") {
    return LETTER_COLORS["O"];
  }
  const firstLetter = name.trim().charAt(0).toUpperCase();
  if (firstLetter >= "A" && firstLetter <= "Z" && LETTER_COLORS[firstLetter]) {
    return LETTER_COLORS[firstLetter];
  }
  // Fallback for numbers or special chars
  const charCode = firstLetter.charCodeAt(0) || 0;
  const letters = Object.keys(LETTER_COLORS);
  return LETTER_COLORS[letters[charCode % letters.length]];
};
