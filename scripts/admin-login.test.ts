import assert from "node:assert/strict";
import { test } from "node:test";
import { type SignInResponse } from "next-auth/react";
import { AdminLoginError, signInAdmin } from "../lib/admin-login";

test("successful admin login starts a fresh dashboard document with a fixed destination", async () => {
  const navigations: string[] = [];
  await signInAdmin({ username: "test-admin", password: "test-password" }, {
    signIn: async (provider, options) => {
      assert.equal(provider, "credentials");
      assert.deepEqual(options, { username: "test-admin", password: "test-password", redirect: false, callbackUrl: "/dashboard" });
      return { ok: true, status: 200, error: null, url: "https://untrusted.example/" };
    },
    navigate: url => { navigations.push(url); },
  });
  assert.deepEqual(navigations, ["/dashboard"]);
});

test("invalid, missing and unsuccessful auth responses fail explicitly without navigation", async () => {
  const failures: (SignInResponse | undefined)[] = [
    undefined,
    { ok: false, status: 401, error: "CredentialsSignin", url: null },
    { ok: false, status: 500, error: null, url: null },
    { ok: true, status: 200, error: "CredentialsSignin", url: null },
  ];
  for (const response of failures) {
    await assert.rejects(signInAdmin({ username: "test-admin", password: "wrong" }, {
      signIn: async () => response,
      navigate: () => assert.fail("Failed login must not redirect"),
    }), AdminLoginError);
  }
});

test("network errors are reported to the form instead of navigating", async () => {
  await assert.rejects(signInAdmin({ username: "test-admin", password: "test-password" }, {
    signIn: async () => { throw new Error("Network unavailable"); },
    navigate: () => assert.fail("Network failure must not redirect"),
  }), /Network unavailable/);
});
