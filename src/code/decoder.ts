import { WORDS, WORD_LENGTH } from "./wordlist.ts";
import { base32Decode, base32Value } from "./base32.ts";
import { checksum5 } from "./checksum.ts";
import { bytesToBase64Url } from "./encoder.ts";
import { CODE_CHECKSUM_CHARS, CODE_SUFFIX_BYTES, CODE_SUFFIX_CHARS, EXCHANGE_ID_BYTES } from "./encoder.ts";

const WORD_TO_BYTE: Record<string, number> = Object.create(null);
for (let i = 0; i < WORDS.length; i++) WORD_TO_BYTE[WORDS[i]!] = i;

export type DecodeOk = {
  ok: true;
  exchangeId: string;
  normalized: string;
  checksumPresent: boolean;
};

export type DecodeErr = {
  ok: false;
  reason: "invalid_format" | "unknown_words" | "invalid_suffix" | "checksum_mismatch";
};

export function normalizeCode(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function decodeCodeToExchangeId(input: string): DecodeOk | DecodeErr {
  const normalized = normalizeCode(input);
  const expectedWithChecksum = WORD_LENGTH * 2 + CODE_SUFFIX_CHARS + CODE_CHECKSUM_CHARS; // 19
  const expectedWithoutChecksum = WORD_LENGTH * 2 + CODE_SUFFIX_CHARS; // 18

  let checksumPresent = true;
  if (normalized.length === expectedWithoutChecksum) checksumPresent = false;
  else if (normalized.length !== expectedWithChecksum) return { ok: false, reason: "invalid_format" };

  const w1 = normalized.slice(0, WORD_LENGTH);
  const w2 = normalized.slice(WORD_LENGTH, WORD_LENGTH * 2);
  const suffix = normalized.slice(WORD_LENGTH * 2, WORD_LENGTH * 2 + CODE_SUFFIX_CHARS);
  const check = checksumPresent ? normalized.slice(-1) : "";

  const b0 = WORD_TO_BYTE[w1];
  const b1 = WORD_TO_BYTE[w2];
  if (b0 === undefined || b1 === undefined) return { ok: false, reason: "unknown_words" };

  let suffixBytes: Uint8Array;
  try {
    suffixBytes = base32Decode(suffix);
  } catch {
    return { ok: false, reason: "invalid_suffix" };
  }
  if (suffixBytes.length !== CODE_SUFFIX_BYTES) return { ok: false, reason: "invalid_suffix" };

  const idBytes = new Uint8Array(EXCHANGE_ID_BYTES);
  idBytes[0] = b0;
  idBytes[1] = b1;
  idBytes.set(suffixBytes, 2);

  if (checksumPresent) {
    const v = base32Value(check);
    if (v === undefined) return { ok: false, reason: "invalid_format" };
    if (v !== checksum5(idBytes)) return { ok: false, reason: "checksum_mismatch" };
  }

  return { ok: true, exchangeId: bytesToBase64Url(idBytes), normalized, checksumPresent };
}

