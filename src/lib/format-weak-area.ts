// weak_areas is supposed to be plain strings (now enforced via responseSchema
// in src/lib/ai.ts), but a row scored before that fix — or any future schema
// drift, since LLM output shape is never fully guaranteed — could still hand
// the UI something else (the {part, improvement} object shape that caused a
// "objects are not valid as a React child" crash). Treat it as untrusted at
// the render boundary rather than assuming the schema always holds.
export function formatWeakArea(w: unknown): string {
  if (typeof w === "string") return w;
  if (w && typeof w === "object") {
    const obj = w as Record<string, unknown>;
    const parts = [obj.part, obj.improvement].filter((v) => typeof v === "string");
    if (parts.length > 0) return parts.join(" — ");
    return JSON.stringify(w);
  }
  return String(w);
}
