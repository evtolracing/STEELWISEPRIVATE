/**
 * How busy a branch is, from its plan (2026-11-22). Demand shaping used to read load figures typed into a
 * settings document for four made-up locations.
 *
 *   capacity     the branch's active machines x 10 hours a day x 5 working days (the Schedule screen's day)
 *   booked       the hours of unfinished plan steps that have a start and an end time, inside the next 7 days,
 *                counted at no more than 10 hours a day each
 *   load         booked / capacity (0 = nothing booked, 1 = the week is full)
 *   queueDays    load x 5: the working days of work already in front of a new job
 *
 * A step with no times on file is not counted, and a branch with no active machine has no load figure
 * (load: null): nothing is suggested from a figure that is not there. Pure.
 */
export const HOURS_PER_DAY = 10;
export const WORKING_DAYS = 5;
const WINDOW_DAYS = 7;
const DAY = 86400000;
const HOUR = 3600000;

export function branchLoad({ machines = 0, steps = [], now = new Date() }) {
  const from = now.getTime();
  const to = from + WINDOW_DAYS * DAY;
  let booked = 0;
  let unscheduled = 0;
  for (const s of steps) {
    if (s.status === 'COMPLETE') continue;
    const start = s.scheduledStart ? new Date(s.scheduledStart).getTime() : NaN;
    const end = s.scheduledEnd ? new Date(s.scheduledEnd).getTime() : NaN;
    if (!(end > start)) { unscheduled += 1; continue; }
    const inside = Math.min(end, to) - Math.max(start, from);
    if (inside <= 0) continue;
    // A step running across days is on its machine for the working day, not the night.
    const daysSpanned = Math.max(1, Math.ceil((end - start) / DAY));
    const worked = Math.min((end - start) / HOUR, daysSpanned * HOURS_PER_DAY);
    booked += worked * (inside / (end - start));
  }
  if (!machines) return { machines: 0, bookedHours: Math.round(booked * 10) / 10, unscheduledSteps: unscheduled, load: null, queueDays: null };
  const load = Math.round((booked / (machines * HOURS_PER_DAY * WORKING_DAYS)) * 100) / 100;
  return { machines, bookedHours: Math.round(booked * 10) / 10, unscheduledSteps: unscheduled, load, queueDays: Math.round(load * WORKING_DAYS * 10) / 10 };
}

/** The branch a screen named: by id, by code, or by name ("GRAND_RAPIDS" for "Grand Rapids"). */
export function branchKeyFor(branches, value) {
  if (!value) return null;
  const want = String(value).trim().toUpperCase().replace(/_/g, ' ');
  const hit = (branches || []).find((b) => b.id === value || b.code.toUpperCase() === want || b.name.toUpperCase() === want);
  return hit ? hit.code : null;
}
