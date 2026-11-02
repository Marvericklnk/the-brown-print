# The Brown Print — Stacked Design

The same newsletter brief explored through a second layout: a stacked cover image, centred introduction and a focused signup card. Editorial Design uses an editorial split layout; Stacked Design uses a dark brown palette and a vertical reading flow.

## Run locally

1. Run `npm install` in this directory.
2. Copy `.env.example` to `.env`, and privately fill in the three email settings. EMAIL_PASS is a Gmail app password.
3. Run `npm run setup` once. Store the displayed dashboard password privately.
4. Run `npm start` and open http://localhost:3000. The owner dashboard is http://localhost:3000/admin.

The public Pages demo validates sample input only. The local server saves subscribers, attempts welcome/owner emails, and provides authenticated campaign preview and sending with unsubscribe links. Real email delivery has not been verified; it needs the owner's settings. SMTP acceptance is not proof of inbox delivery.

Do not commit `.env`, subscriber lists or newsletter history. JSON storage is a single-process learning implementation. Public production use requires persistent storage, signup abuse protection and suitable consent/privacy information.

## Changes during portfolio preparation

Fixed a malformed CSS comment, added small-screen text wrapping, used a stable workspace image, and replaced the CDN toast dependency with a small local five-second notification. The source keeps the real API request; the separate public demo creates no subscription.

## Understanding the flow

- `public/script.js` listens for submit, prevents reload, trims and validates input, disables the button, and POSTs to `/api/signup`.
- `server.cjs` validates again, normalises email, checks duplicates and queues file writes before attempting notification emails.
- `newsletter.cjs` handles password-hash authentication, session cookies, CSRF checks, campaign previews and unsubscribe links.
- `public/admin.js` controls the dashboard without placing secret settings in browser code.

Development includes AI assistance; the project documentation describes functionality and limitations rather than claiming unaided authorship.
