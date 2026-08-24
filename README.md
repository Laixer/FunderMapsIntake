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

## Shape

```
app/pages/index.vue            the form
app/pages/form/[bag].vue       prefilled deep link — the reason SSR is on
app/pages/melding/[code].vue   status of an earlier melding
server/api/upload-url.post.ts  one presigned PUT per file
server/api/submit.post.ts      validates, then POSTs to FunderMapsApi /api/intake/incident
server/api/status.post.ts      meldcode + email lookup via /api/intake/status
```

## Files

Attachments upload the moment they are chosen, not on submit — a melder who
taps "Versturen" and then waits 30 seconds for a 20 MB scan assumes it hung.

The browser never holds a credential. It asks the server for one presigned PUT
scoped to one generated key under `incident-report/`, and the melder's own
filename never reaches the key: it travels in the submission body instead,
which keeps traversal, unicode and duplicate names out of the bucket.

On submit the server re-checks both halves of what the browser claims — the key
must sit under `incident-report/`, and the object must exist. Without the prefix
check a crafted submission could attach `inquiry-report/…`, someone else's
evidence, to a melding and read it back through the portal.

## What we store, and one thing that broke

`incident.document_file` is meant to hold object keys. From 2020 to 2024 it did.
Something changed in 2025 and it started storing the melder's original filename
instead, so **238 attachments on 2025–2026 incidents cannot be located in
Spaces** — the objects are there under a uuid nobody wrote down. Recovering them
means matching on upload timestamp, extension and count.

This app stores keys in `document_file` and the human-readable record — name,
size, category — in `metadata.attachments`.

## Meldcodes are not secrets

`FIR992026-7263` is one increment from someone else's melding, so the status
page requires the email that made the submission, and a wrong email returns
exactly the same 404 as a code that does not exist. A distinguishable answer
would turn the page into a way to enumerate which codes are real.

## Configuration

Server-only, except `NUXT_PUBLIC_API_BASE`:

```
NUXT_S3_ACCESS_KEY   NUXT_S3_SECRET_KEY   NUXT_S3_BUCKET (default: fundermaps)
NUXT_API_BASE        NUXT_INTAKE_TOKEN
NUXT_PUBLIC_API_BASE (the geocoder is public; the browser calls it directly)
```

Point `NUXT_S3_BUCKET` at `fundermaps-development` when developing. Nothing here
may ever write to `dataops/` or `inquiry-report/`.

## The bucket needs CORS, or uploads silently die

The browser PUTs straight to Spaces, which is a cross-origin request, and
**neither `fundermaps` nor `fundermaps-development` had any CORS rule**. curl
does not care and passes; a real browser refuses the PUT and every attachment
fails with "Uploaden is niet gelukt".

`fundermaps-development` now allows PUT from `localhost:4321` and `:3000`.
Before this app is deployed, the production bucket needs the same rule with the
real origin:

```json
{ "CORSRules": [ {
  "AllowedOrigins": ["https://<intake-host>"],
  "AllowedMethods": ["PUT"],
  "AllowedHeaders": ["content-type"],
  "MaxAgeSeconds": 3000
} ] }
```

```
aws s3api put-bucket-cors --bucket fundermaps \
  --cors-configuration file://cors.json \
  --endpoint-url https://ams3.digitaloceanspaces.com
```

PUT only, and no GET: CORS grants a browser nothing a presigned URL did not
already grant, but there is no reason to widen the main data bucket further
than the one method this app uses.
