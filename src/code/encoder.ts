import { WORDS } from "./wordlist.ts";
import { base32Char, base32Encode } from "./base32.ts";
import { checksum5 } from "./checksum.ts";

export const CODE_SUFFIX_BYTES = 5 as const; // 40 bits → 8 base32 chars
export const CODE_SUFFIX_CHARS = 8 as const;
export const CODE_CHECKSUM_CHARS = 1 as const;
export const EXCHANGE_ID_BYTES = 7 as const; // 56 bits

export function encodeExchangeIdToCode(exchangeIdBase64Url: string): string {
  const idBytes = base64UrlToBytes(exchangeIdBase64Url);
  if (idBytes.length !== EXCHANGE_ID_BYTES) throw new Error("invalid exchange id bytes");

  const word1 = WORDS[idBytes[0]!]!;
  const word2 = WORDS[idBytes[1]!]!;
  const suffixBytes = idBytes.slice(2);
  if (suffixBytes.length !== CODE_SUFFIX_BYTES) throw new Error("invalid suffix bytes");

  const suffix = base32Encode(suffixBytes).slice(0, CODE_SUFFIX_CHARS);
  const check = base32Char(checksum5(idBytes));
  return `${word1}-${word2}-${suffix}${check}`;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function base64UrlToBytes(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "base64url"));
}

