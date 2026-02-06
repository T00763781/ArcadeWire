import type { Clock } from "../domain/types.ts";
import { DefaultStore } from "./store.ts";

export type ResolveResult =
  | { ok: true; state: "resolved"; resolvedAt: Date }
  | { ok: false; state: "expired"; message: string }
  | { ok: false; state: "resolved"; message: string }
  | { ok: false; state: "missing"; message: string };

export function resolveExchange(clock: Clock, exchangeId: string): ResolveResult {
  const exchange = DefaultStore.get(exchangeId);
  if (!exchange) return { ok: false, state: "missing", message: "That code doesn’t match an active ArcadeWire." };

  const now = clock.now();
  exchange.expire(now);

  if (exchange.state === "expired") {
    return { ok: false, state: "expired", message: "That ArcadeWire expired. Create a new one and try again." };
  }

  if (exchange.state === "resolved") {
    return { ok: false, state: "resolved", message: "That ArcadeWire was already used." };
  }

  exchange.resolve(now);
  if (exchange.state !== "resolved" || !exchange.resolvedAt) {
    return { ok: false, state: "expired", message: "That ArcadeWire expired. Create a new one and try again." };
  }

  return { ok: true, state: "resolved", resolvedAt: exchange.resolvedAt };
}

