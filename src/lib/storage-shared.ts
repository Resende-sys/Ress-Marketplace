// Tipos e regras comuns ao navegador e ao servidor.

export type Bucket = "covers" | "previews" | "masters";

export const BUCKETS: readonly Bucket[] = ["covers", "previews", "masters"];

/** Chaves aceitas: "<pasta-do-beat>/<arquivo>", sem ".." nem caracteres estranhos. */
export function isValidKey(key: unknown): key is string {
  return (
    typeof key === "string" &&
    key.length > 0 &&
    key.length <= 512 &&
    /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)+$/.test(key) &&
    !key.includes("..")
  );
}
