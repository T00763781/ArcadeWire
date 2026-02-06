import test from "node:test";
import assert from "node:assert/strict";

import { Exchange } from "../src/domain/Exchange.ts";

test("pending → resolved is terminal", () => {
  const createdAt = new Date("2020-01-01T00:00:00.000Z");
  const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
  const ex = Exchange.create({ id: "id", createdAt, expiresAt });

  ex.resolve(new Date(createdAt.getTime() + 1000));
  assert.equal(ex.state, "resolved");

  ex.expire(new Date(expiresAt.getTime() + 1));
  assert.equal(ex.state, "resolved");
});

test("pending expires at expiresAt", () => {
  const createdAt = new Date("2020-01-01T00:00:00.000Z");
  const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
  const ex = Exchange.create({ id: "id", createdAt, expiresAt });

  ex.expire(new Date(expiresAt.getTime()));
  assert.equal(ex.state, "expired");
});

