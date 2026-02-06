import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { bytesToBase64Url, encodeExchangeIdToCode } from "../src/code/encoder.ts";
import { decodeCodeToExchangeId } from "../src/code/decoder.ts";

test("encode/decode roundtrip", () => {
  const idBytes = crypto.randomBytes(7);
  const id = bytesToBase64Url(idBytes);
  const code = encodeExchangeIdToCode(id);

  const decoded = decodeCodeToExchangeId(code);
  assert.equal(decoded.ok, true);
  if (!decoded.ok) return;
  assert.equal(decoded.exchangeId, id);
});

test("decoder accepts missing hyphens and case-insensitive input", () => {
  const idBytes = crypto.randomBytes(7);
  const id = bytesToBase64Url(idBytes);
  const code = encodeExchangeIdToCode(id);

  const compact = code.replaceAll("-", "").toUpperCase();
  const decoded = decodeCodeToExchangeId(compact);
  assert.equal(decoded.ok, true);
});

test("checksum mismatch is detected", () => {
  const idBytes = crypto.randomBytes(7);
  const id = bytesToBase64Url(idBytes);
  const code = encodeExchangeIdToCode(id);

  const last = code.slice(-1);
  const mutated = code.slice(0, -1) + (last === "0" ? "1" : "0");
  const decoded = decodeCodeToExchangeId(mutated);
  assert.equal(decoded.ok, false);
  if (decoded.ok) return;
  assert.equal(decoded.reason, "checksum_mismatch");
});

