export type ExchangeState = "pending" | "resolved" | "expired";

export type ExchangeId = string;

export type Clock = {
  now(): Date;
};

export const SystemClock: Clock = {
  now: () => new Date(),
};

