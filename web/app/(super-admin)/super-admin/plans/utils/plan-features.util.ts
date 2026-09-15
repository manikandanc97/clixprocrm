export type ConfigTab = "basic" | "pricing" | "limits" | "ai" | "features";

export function filterPureFeatures(features: string[]): string[] {
  if (!Array.isArray(features)) return [];
  return features.filter((feat) => {
    if (!feat || typeof feat !== "string") return false;
    const f = feat.trim();
    // Exclude quota repetitions matching top tiles (team members/seats, leads, contacts, storage)
    if (/^\s*(up to \d+|\d+[\d,]*|unlimited)\s*(team members|users|members|seats)/i.test(f)) return false;
    if (/\b\d+[\d,]*\s*contacts\b/i.test(f) && /\b\d+[\d,]*\s*leads\b/i.test(f)) return false;
    if (/^\s*(unlimited\s*)?(contacts|leads)\s*(&|and)?\s*(contacts|leads)?/i.test(f) && /\b(contacts|leads)\b/i.test(f)) return false;
    if (/^\s*\d+[\d,]*\s*GB\s*(cloud\s*)?storage/i.test(f)) return false;
    return true;
  });
}
