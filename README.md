# The Brown Print

A responsive newsletter landing page by Marvin, developed with ChatGPT/Codex assistance.

## Try it

The public GitHub Pages version is a **frontend demonstration**. Enter sample details only: it validates the form and opens a demo confirmation page, but does not create a subscription or send emails.

The complete local Express version saves signups to a private JSON file. It does not send emails.

## Development, layer by layer

These stages were **reconstructed from the completed design for learning and review**. They are not a backdated record of original development. The commits are made now and show the implementation in a readable order.

| Stage | Files | What changes |
| --- | --- | --- |
| 01 — Structure | [HTML](stages/01/index.html) | Headings, paragraphs, labels and a form, without styling. |
| 02 — Visual design | [Design](stages/02/) | Brown-and-cream palette, typography, image treatment and desktop layout. |
| 03 — Responsive layout | [Responsive](stages/03/) | Breakpoints, stacked columns and smaller spacing for narrow screens. |
| 04 — Interaction | [JavaScript](stages/04/script.js) | Form validation, visible errors and a demo thank-you page. |
| 05 — Local backend | [Server](server.js) | Express endpoint, duplicate checks and serialized file writes. |

## Run the full local version

Requires Node.js and npm.

```bash
npm install
npm start
```

Open http://localhost:3000. Use the Node server rather than Live Server for the backend version.

## Project map

- `public/`: actual frontend that calls `/api/signup`.
- `server.js`: local signup API and static server.
- `docs/`: public demo; no data collection.
- `stages/`: educational snapshots.
- `content/`: X and LinkedIn drafts, technical article, walkthrough plan and account setup checklist.
- `media/`: screenshots, short captioned video and original profile header.

## Technical decisions

- CSS Grid handles the main two-column layout; media queries stack it on smaller viewports.
- A shared stylesheet keeps the landing and thank-you pages consistent.
- Real labels, focus outlines and live error messages support keyboard use.
- The server validates again, lowercases emails and rejects duplicates.
- File writes are queued and use a temporary file plus rename to avoid overlapping writes in one Node process.

## Limits

JSON storage is for this single-process learning project. Before collecting real subscriptions, use a database, an email provider, suitable consent/privacy information and abuse protection. No email delivery, subscriber login or production newsletter service is claimed.

`subscribers.json` and `.env` are excluded from version control. Never upload real subscriber data.

Fonts load from Google Fonts and the workspace photo is hosted on Unsplash. Fallback fonts and background colours remain available when those services cannot load.
