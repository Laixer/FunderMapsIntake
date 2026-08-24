# FunderMaps Intake

The public terugmeldformulier. Someone tells us the foundation information we
hold for a building is wrong, or hands us the evidence that proves it.

No login. Most people arrive once, on a phone, having just found something
worrying about their own house — so the whole design question is how little we
can ask of them while still getting something a reviewer can act on.

## Why Nuxt

Every other FunderMaps frontend is Vue 3 + Vite + Tailwind + pnpm. React here
would mean two component ecosystems in one estate and a form that nobody who
maintains the Studio could confidently change.

SSR is on for one reason: `/form/<bag-id>` is a prefilled deep link partners
hand out, and resolving the address on the server saves a round trip on 4G.

## The contract is the important part

`app/services/contract.ts` holds the key names and Dutch labels a submission
carries. The triage rules and the handler views match on those literal strings,
and every submission ever made uses them. **Renaming one silently breaks routing
for the whole back catalogue** — ship a mapping in the same commit or don't
rename.

`noDamage` is the standing example: the topic was once "er is geen schade" and
is now "wijzig funderingsrisico". The key was deliberately left alone.

## Evidence decides everything

Four of the six topics cannot be processed without an attachment, and the form
says so before it asks for anything else. Each file carries a category chosen by
the melder, and that label is the strongest signal the back end gets:

- `herstelbewijs` routes to the recovery workflow whatever topic was picked
- `quickscan` stops the pipeline reading a foundation type back off our own
  data — a QuickScan states a type it took from FunderMaps, so accepting it
  would be a loop. Don rejected 26 of 83 machine-read values for exactly this.
