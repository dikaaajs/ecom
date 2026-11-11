# Admin login behavior

Both `/auth/signin` and `/auth/login` use the same admin-login hook.
Only a successful NextAuth Credentials response navigates to `/dashboard`.
Navigation replaces the current document so the dashboard's SessionProvider
reads the new session cookie instead of retaining an unauthenticated client
state. It does not depend on a second `getSession()` returning a truthy value.
The destination is fixed and does not trust an arbitrary response URL.

Invalid/missing responses and connection errors show a Sonner error toast plus
an inline accessible message. Submission stays disabled during authentication
and navigation, and is re-enabled after failure. The dashboard renders its
content only after an authenticated admin session is available.

Regression tests:

```powershell
npx.cmd tsx --test scripts/admin-login.test.ts scripts/account-security.test.ts scripts/site-settings.test.ts
npx.cmd tsc --noEmit
npm.cmd run build
```

Also checked locally: wrong credentials display a toast and re-enable the form;
configured admin credentials create an admin session cookie and the dashboard
returns HTTP 200. No admin account or password was changed during testing.
