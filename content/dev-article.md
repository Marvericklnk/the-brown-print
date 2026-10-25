---
title: "Separating a newsletter UI demo from a signup backend"
description: "A technical walkthrough of The Brown Print learning project"
tags: javascript, css, beginners, webdev
published: false
---

# Separating a newsletter UI demo from a signup backend

The Brown Print is a learning project developed with ChatGPT/Codex assistance. This article describes the implementation; it does not claim a personal debugging story or measured production results.

## The same page can have two different responsibilities

The `public/` frontend posts a name and email to `/api/signup`. The `docs/` frontend is a static portfolio demo: it validates sample details and opens a demo confirmation without saving anything. Labelling that distinction prevents a working-looking form from implying a real subscription.

## Responsive structure

The hero and signup section use two-column CSS Grid layouts. At the phone breakpoint, `grid-template-columns: 1fr` stacks the content. Fluid text sizes, bounded containers and reduced padding help the layout adapt rather than simply shrinking a desktop screenshot.

## Client validation improves feedback

JavaScript trims the name and checks the email input. Errors update a live status message, set `aria-invalid` and move focus to the field. Labels remain visible when placeholders disappear.

Client validation is not a substitute for server validation: a request can be made without using the form.

## The local server validates again

The Express endpoint checks types and lengths, lowercases email addresses and rejects duplicates. A promise queue serializes read-modify-write operations within one Node process. A temporary file and rename reduce the chance of a partially written JSON file.

This is not a multi-instance database. A production newsletter needs durable database storage and an email delivery service, along with appropriate consent and abuse prevention.

## Review the layers

The repository contains five educational stages reconstructed from the completed implementation. They make the code easier to inspect without pretending that the snapshots are an original chronological history.

Source: https://github.com/Marvericklnk/the-brown-print
