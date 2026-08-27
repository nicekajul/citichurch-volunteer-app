# Supabase Auth Email Templates

Static HTML source for every Supabase Auth email template, kept in the repo so
they're version-controlled instead of only living inside the Supabase
dashboard. Supabase's hosted dashboard has no "load from file" option, so
after editing one of these, copy its full contents and paste it into:

**Supabase Dashboard → Authentication → Emails → Templates → [matching type]**

| File | Supabase template | Notes |
|---|---|---|
| `confirm-signup.html` | Confirm signup | Sent when a volunteer signs up directly (not invited). |
| `invite.html` | Invite user | Sent by the app's "Approve & Invite" flow for walk-in applicants. |
| `magic-link.html` | Magic Link | Only relevant if passwordless sign-in is ever enabled — not currently used by the app's login flow. |
| `change-email.html` | Change Email Address | Sent when a user changes their account email. |
| `reset-password.html` | Reset Password | Not yet wired to a "Forgot password?" link in the app — the template is ready for when that's built. |
| `reauthentication.html` | Reauthentication | Sent for a sensitive in-session action; shows a code only (no link), since the user is already signed in on the device where they enter it. |

## Design

All six share the same shell: dark card (`#141414`) on a near-black page
(`#0d0d0d`), solid black header with the Citichurch logo forced white via
`filter:brightness(0) invert(1)`, brand red `#9A1418` for the primary button
and accents. `confirm-signup.html` and `invite.html` are the two "welcome"
emails and include the "What's waiting for you" feature list; the other four
are short transactional emails with a single call to action.

The logo is loaded from `https://www.citichurch.ph/wp-content/uploads/2019/07/logo-citichurch.png`
— it must stay publicly reachable for email clients to render it, since email
HTML can't reference files from this app's own domain/build output.

## Template variables used

Supabase renders these with Go's `text/template`, so `{{ if .X }}...{{ end }}`
conditionals work if a variable might be empty.

- **confirm-signup.html** — `{{ .ConfirmationURL }}`
- **invite.html** — `{{ .ConfirmationURL }}`, `{{ .Data.name }}` (optional
  greeting — populated from the `data` object passed to
  `supabaseAdmin.auth.admin.inviteUserByEmail()`; see
  `app/api/admin/applications/review/route.ts`)
- **magic-link.html** — `{{ .ConfirmationURL }}`, `{{ .Token }}` (6-digit code
  fallback for the same link)
- **change-email.html** — `{{ .ConfirmationURL }}`, `{{ .Email }}` (current
  address), `{{ .NewEmail }}` (address being confirmed)
- **reset-password.html** — `{{ .ConfirmationURL }}`, `{{ .Email }}`
- **reauthentication.html** — `{{ .Token }}` only (no confirmation link for
  this type — Supabase doesn't provide one, by design)

## Editing

Keep both copies in sync: edit the file here, test the change by pasting it
into the Supabase dashboard's template preview, then paste the final version
back into the dashboard to actually apply it to outgoing email.
