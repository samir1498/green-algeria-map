# ADR 001: Volunteer Social-Proof Counter

**Status:** Accepted  
**Date:** 2026-05-26

## Context

The map displays reforestation zones that users can volunteer for. We need a mechanism to encourage participation and signal community engagement for each zone.

## Decision

We add a `volunteerCount` integer column to the `zones` table (default 0) with a public `POST /zones/:id/volunteer` endpoint that increments it.

**Why not a dedicated interest table?**
- MVP priority — a table with user_id + zone_id + timestamps requires auth, more queries, and offers no immediate UX benefit over a simple counter
- No per-user dedup needed at this stage — the button is disabled after one click per session (client-side only)
- The counter acts as social proof ("14 volunteers"), which is the primary UX goal

**Why not just track clicks in analytics?**
- The count should be visible on the map itself (in the zone popup), not buried in a dashboard
- Persisting to the DB makes the data available via the public API

## Consequences

- Positive: Simple to implement, strong social proof signal, follows existing `@Public()` pattern
- Positive: No auth required, lowers friction to participate
- Negative: No dedup — a single user can increment the counter multiple times across sessions
- Negative: No audit trail — we can't answer "who volunteered for what"

The dedup and audit trail concerns can be addressed in a future iteration by adding a `volunteers` table and migrating the counter to a computed column.
