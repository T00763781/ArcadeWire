import type { IncomingMessage, ServerResponse } from "node:http";
import { SystemClock } from "../domain/types.ts";
import { createExchange } from "../services/createExchange.ts";

export async function handleCreate(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const { exchange, code } = createExchange(SystemClock);
  respondJson(res, 200, {
    code,
    expiresAt: exchange.expiresAt.toISOString(),
  });
}

function respondJson(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(json);
}

