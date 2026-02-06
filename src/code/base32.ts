// Crockford Base32 (human-friendly) with tolerant decoding.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ" as const;
const DECODE: Record<string, number> = Object.create(null);

for (let i = 0; i < ALPHABET.length; i++) {
  DECODE[ALPHABET[i]!] = i;
}

// Tolerate common confusions.
DECODE["O"] = DECODE["0"];
DECODE["I"] = DECODE["1"];
DECODE["L"] = DECODE["1"];
DECODE["U"] = DECODE["V"]; // not in alphabet; accept as V-ish

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";

  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]!;
      bits -= 5;
    }
  }

  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 31]!;
  }

  return out;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const ch of clean) {
    const v = DECODE[ch];
    if (v === undefined) throw new Error("invalid base32 character");
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(out);
}

export function base32Char(n: number): string {
  return ALPHABET[n & 31]!;
}

export function base32Value(ch: string): number | undefined {
  return DECODE[ch.toUpperCase()];
}

