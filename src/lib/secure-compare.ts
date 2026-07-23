import "server-only";
import { timingSafeEqual } from "node:crypto";

// Constant-time string comparison for secrets/bearer tokens so verification time
// does not leak how many leading characters matched.
export function safeEqual(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
