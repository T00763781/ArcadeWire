import type { ExchangeId, ExchangeState } from "./types.ts";

export type ExchangeProps = {
  id: ExchangeId;
  state: ExchangeState;
  createdAt: Date;
  expiresAt: Date;
  resolvedAt?: Date;
};

export class Exchange {
  readonly id: ExchangeId;
  private _state: ExchangeState;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  private _resolvedAt?: Date;

  private constructor(props: ExchangeProps) {
    this.id = props.id;
    this._state = props.state;
    this.createdAt = props.createdAt;
    this.expiresAt = props.expiresAt;
    this._resolvedAt = props.resolvedAt;
  }

  static create(props: { id: ExchangeId; createdAt: Date; expiresAt: Date }): Exchange {
    return new Exchange({
      id: props.id,
      state: "pending",
      createdAt: props.createdAt,
      expiresAt: props.expiresAt,
    });
  }

  get state(): ExchangeState {
    return this._state;
  }

  get resolvedAt(): Date | undefined {
    return this._resolvedAt;
  }

  expire(now: Date): void {
    if (this._state !== "pending") return;
    if (now < this.expiresAt) return;
    this._state = "expired";
  }

  resolve(now: Date): void {
    if (this._state !== "pending") return;
    if (now >= this.expiresAt) {
      this._state = "expired";
      return;
    }
    this._state = "resolved";
    this._resolvedAt = now;
  }

  toJSON(): ExchangeProps {
    return {
      id: this.id,
      state: this._state,
      createdAt: new Date(this.createdAt),
      expiresAt: new Date(this.expiresAt),
      resolvedAt: this._resolvedAt ? new Date(this._resolvedAt) : undefined,
    };
  }
}

