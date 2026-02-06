// 5-bit checksum (typo detection), derived from bytes (no secrets).
export function checksum5(bytes: Uint8Array): number {
  // FNV-1a 32-bit, then fold to 5 bits.
  let hash = 0x811c9dc5;
  for (const b of bytes) {
    hash ^= b;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash ^= hash >>> 8;
  return hash & 31;
}

