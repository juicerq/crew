# Find an account and diagnose login

For an app missing from `auth.md`, follow its seed entry from `package.json` scripts such as `db:seed` or `db:reseed`. Search the backend for seed and fixture files, including `prisma/seed.ts`, `db/seeds/`, and a `users.*` file beneath them. Seed inputs often contain the password before hashing; use the exact current email and password. Choose the role the task exercises, or the first user when roles do not matter. Keep credential values out of notes and tool output.

A seed file proves what a seed would create. It does not prove that this database has those users.

## Diagnose the failed attempt

Capture the page's error with a snapshot or screenshot. Check the exact credentials and account role against their source, then establish which backend and database the running app actually uses. Read the relevant uncommented configuration, such as `apps/api/.env`, and account for runtime overrides. Inspect only needed fields; do not print connection strings or passwords.

A remote hostname identifies an environment, not its contents. For example, a staging clone may contain the seed user, while a local database may never have been seeded. Check the project's environment instructions, the keyring entry, and permitted read-only account evidence before deciding which case applies:

- **Credentials disagree with the source.** Correct the email or password and retry the observed form.
- **Account is missing in the intended environment.** Use an existing valid account for that environment, or ask for one when none is available. If seeding is the intended repair, inspect its effects and obtain authorization before running it unless already authorized. A seed can reset more than a login.
- **App uses the wrong environment.** Identify the configured host without exposing secrets. Switching a database in `.env` affects more than the browser task; ask before changing it unless that switch is already part of the authorized work.
- **Account exists but login still fails.** Follow the actual error through the app's authentication path. Check readiness, session state, and the account's login requirements rather than repeatedly submitting the same credentials.

When the evidence cannot distinguish these cases, report the error and the missing observation. Do not infer an absent seed from a remote domain or reset a database to make the browser check pass.
