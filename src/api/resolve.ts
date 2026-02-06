import type { IncomingMessage, ServerResponse } from "node:http";
import { SystemClock } from "../domain/types.ts";
import { decodeCodeToExchangeId } from "../code/decoder.ts";
import { resolveExchange } from "../services/resolveExchange.ts";
import { readJsonBody } from "./utils.ts";

export async function handleResolve(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readJsonBody(req);
  const code = typeof body?.code === "string" ? body.code : "";
  const decoded = decodeCodeToExchangeId(code);

  if (!decoded.ok) {
    const message =
      decoded.reason === "checksum_mismatch"
        ? "That code looks mistyped. Double-check the letters and numbers."
        : "That doesn’t look like an ArcadeWire code.";
    respondJson(res, 400, { ok: false, reason: decoded.reason, message });
    return;
  }

  const result = resolveExchange(SystemClock, decoded.exchangeId);
  if (!result.ok) {
    const status = result.state === "missing" ? 404 : 409;
    respondJson(res, status, { ok: false, state: result.state, message: result.message });
    return;
  }

  respondJson(res, 200, { ok: true, state: "resolved", resolvedAt: result.resolvedAt.toISOString() });
}

function respondJson(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(json);
}

