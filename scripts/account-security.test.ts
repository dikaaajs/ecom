import assert from "node:assert/strict";
import { test } from "node:test";
import { requestIp } from "../lib/account/security";

test("requestIp handles NextAuth and Web requests without bypassing proxy trust", () => {
  const previous = process.env.AUTH_TRUST_PROXY;
  try {
    process.env.AUTH_TRUST_PROXY = "true";
    assert.equal(requestIp({}), "unknown");
    assert.equal(requestIp({ headers: undefined }), "unknown");
    assert.equal(requestIp({ headers: {} }), "unknown");
    assert.equal(requestIp({ headers: new Headers() }), "unknown");
    assert.equal(requestIp({ headers: { "x-forwarded-for": " 203.0.113.1, 203.0.113.2" } }), "203.0.113.1");
    assert.equal(requestIp({ headers: new Headers({ "x-forwarded-for": "203.0.113.3, 203.0.113.4" }) }), "203.0.113.3");
    assert.equal(requestIp({ headers: { "x-forwarded-for": "  " } }), "unknown");
    assert.equal(requestIp({ headers: { "x-forwarded-for": "a".repeat(150) } }).length, 100);

    for (const trust of [undefined, "false"]) {
      if (trust === undefined) delete process.env.AUTH_TRUST_PROXY;
      else process.env.AUTH_TRUST_PROXY = trust;
      assert.equal(requestIp({}), "untrusted-client");
      assert.equal(requestIp({ headers: { "x-forwarded-for": "203.0.113.1" } }), "untrusted-client");
      assert.equal(requestIp({ headers: new Headers({ "x-forwarded-for": "203.0.113.1" }) }), "untrusted-client");
    }
  } finally {
    if (previous === undefined) delete process.env.AUTH_TRUST_PROXY;
    else process.env.AUTH_TRUST_PROXY = previous;
  }
});
