/**
 * Daily traffic rollup: aggregates room_events into traffic_stats.
 *
 * Called from the 5-minute sweeper (and once at boot). The upsert is
 * idempotent — re-running for the same day just recomputes the numbers, so
 * a crash mid-day loses nothing. Timestamps are UTC (datetime('now')), so
 * the "day" boundary is UTC as well.
 */

import { db } from './db.js';

function utcDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function rollupTrafficStats(now: Date = new Date()): void {
  const date = utcDate(now);

  const totalRooms = db.prepare(
    "SELECT COUNT(*) as n FROM room_events WHERE event_type = 'created' AND date(timestamp) = ?"
  ).get(date) as { n: number };

  const totalViewers = db.prepare(
    "SELECT COUNT(*) as n FROM room_events WHERE event_type = 'viewer_joined' AND date(timestamp) = ?"
  ).get(date) as { n: number };

  // Peak concurrent viewers = highest viewer_count recorded by any join event.
  const peak = db.prepare(
    "SELECT MAX(viewer_count) as m FROM room_events WHERE event_type = 'viewer_joined' AND date(timestamp) = ?"
  ).get(date) as { m: number | null };

  // Countries: hosts (created) + viewers (joined). viewer_left is excluded —
  // it would double-count the same person within the day.
  const countryRows = db.prepare(
    `SELECT country, COUNT(*) as count FROM room_events
     WHERE date(timestamp) = ? AND country IS NOT NULL AND country != '??'
       AND event_type IN ('created', 'viewer_joined')
     GROUP BY country ORDER BY count DESC`
  ).all(date) as { country: string; count: number }[];

  const countries: Record<string, number> = {};
  for (const row of countryRows) countries[row.country] = row.count;

  db.prepare(`
    INSERT INTO traffic_stats (date, total_rooms, peak_viewers, total_viewers, countries)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      total_rooms = excluded.total_rooms,
      peak_viewers = excluded.peak_viewers,
      total_viewers = excluded.total_viewers,
      countries = excluded.countries
  `).run(date, totalRooms.n, peak.m ?? 0, totalViewers.n, JSON.stringify(countries));
}
