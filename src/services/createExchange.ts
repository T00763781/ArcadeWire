import crypto from "node:crypto";
import { Exchange } from "../domain/Exchange.ts";
import type { Clock } from "../domain/types.ts";
import { bytesToBase64Url, encodeExchangeIdToCode } from "../code/encoder.ts";
import { DefaultStore } from "./store.ts";

export function createExchange(clock: Clock): { exchange: Exchange; code: string } {
  const createdAt = clock.now();
  const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);

  const idBytes = crypto.randomBytes(7);
  const id = bytesToBase64Url(idBytes);

  const exchange = Exchange.create({ id, createdAt, expiresAt });
  DefaultStore.put(exchange);

  const code = encodeExchangeIdToCode(exchange.id);
  return { exchange, code };
}

