import type { ExchangeId } from "../domain/types.ts";
import { Exchange } from "../domain/Exchange.ts";

export class ExchangeStore {
  private readonly byId = new Map<ExchangeId, Exchange>();

  get(id: ExchangeId): Exchange | undefined {
    return this.byId.get(id);
  }

  put(exchange: Exchange): void {
    this.byId.set(exchange.id, exchange);
  }
}

export const DefaultStore = new ExchangeStore();

