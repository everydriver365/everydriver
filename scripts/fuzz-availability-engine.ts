#!/usr/bin/env bun
// =============================================================================
// fuzz-availability-engine.ts
// CI fuzz test: parseHHMM and isAllDayLikeEvent must NEVER regress their
// fail-closed behaviour.  Any malformed input must return null / false.
// =============================================================================

import { parseHHMM, isAllDayLikeEvent } from "../src/lib/availabilityEngine";

let failures = 0;
let total = 0;

function assert(condition: boolean, label: string) {
  total++;
  if (!condition) {
    failures++;
    console.error(`FAIL: ${label}`);
  }
}

// ---------------------------------------------------------------------------
// FUZZ CORPUS for parseHHMM
// ---------------------------------------------------------------------------

const parseHHMMFailures: (string | null | undefined)[] = [
  // Null / undefined / empty
  null,
  undefined,
  "",
  "   ",
  "\t",
  "\n",
  // Garbage
  "garbage",
  "nope",
  "foo:bar",
  "abc",
  // Wrong separators
  "09-00",
  "09/00",
  "09.00",
  "09 00",
  // Missing parts
  "9",
  "09",
  "9:0",
  // Out of range hours
  "25:00",
  "99:00",
  "-01:00",
  "24:01",
  // Out of range minutes
  "10:60",
  "10:99",
  "10:-01",
  // Extra junk
  "09:00:00:00",
  "09:00abc",
  "abc09:00",
  "09:00 ",
  " 09:00",
  // Object / number masquerading as string (coercion surface)
  // @ts-expect-error intentional fuzz
  123,
  // @ts-expect-error intentional fuzz
  {},
  // @ts-expect-error intentional fuzz
  [],
  // @ts-expect-error intentional fuzz
  true,
  // Unicode / emoji / control chars
  "09\u0000:00",
  "09:00\ud83d\ude00",
  "\u200b", // zero-width space
  // SQL injection / XSS style
  "09:00'; DROP TABLE--",
  "<script>alert(1)</script>",
  // Very long
  "9".repeat(1000) + ":00",
  "09:" + "0".repeat(1000),
];

// ---------------------------------------------------------------------------
// FUZZ CORPUS for isAllDayLikeEvent
// ---------------------------------------------------------------------------

interface IsoPair { start: string; end: string }

const isAllDayLikeFailures: IsoPair[] = [
  // Garbage strings
  { start: "garbage", end: "also-garbage" },
  { start: "", end: "" },
  { start: "nope", end: "nope" },
  { start: "foo", end: "bar" },
  // Empty / whitespace
  { start: "   ", end: "   " },
  { start: "\t", end: "\t" },
  // Missing components
  { start: "2026-06-15", end: "2026-06-15" },
  { start: "10:00:00", end: "11:00:00" },
  // Zero / negative duration
  { start: "2026-06-15T10:00:00Z", end: "2026-06-15T10:00:00Z" },
  { start: "2026-06-15T11:00:00Z", end: "2026-06-15T10:00:00Z" },
  // Invalid date values
  { start: "2026-13-45T25:70:99Z", end: "2026-13-45T26:80:00Z" },
  { start: "not-a-date", end: "also-not" },
  // Malformed ISO but close
  { start: "2026-06-15 10:00:00", end: "2026-06-15 11:00:00" },
  { start: "15/06/2026 10:00", end: "15/06/2026 11:00" },
  // Object injection attempts (coercion surface)
  // @ts-expect-error intentional fuzz
  { start: {}, end: {} },
  // @ts-expect-error intentional fuzz
  { start: [], end: [] },
  // @ts-expect-error intentional fuzz
  { start: null, end: null },
  // @ts-expect-error intentional fuzz
  { start: undefined, end: undefined },
  // Very long garbage
  { start: "x".repeat(5000), end: "y".repeat(5000) },
];

// ---------------------------------------------------------------------------
// Randomised fuzz for isAllDayLikeEvent (1000 iterations)
// ---------------------------------------------------------------------------

function randomString(len: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?`~\u0000\u200b";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function randomDateIso(): string {
  // Occasionally produce a valid-looking ISO string to ensure we don't
  // accidentally fail a *valid* input.
  const y = 1980 + Math.floor(Math.random() * 60);
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  const h = Math.floor(Math.random() * 24);
  const min = Math.floor(Math.random() * 60);
  const sec = Math.floor(Math.random() * 60);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}Z`;
}

// ---------------------------------------------------------------------------
// Run corpus against parseHHMM
// ---------------------------------------------------------------------------

console.log("\n=== parseHHMM fuzz (corpus) ===");

for (const input of parseHHMMFailures) {
  const result = parseHHMM(input);
  assert(result === null, `parseHHMM(${JSON.stringify(input)}) must return null, got ${result}`);
}

// Randomised fuzz: 1000 random strings should all return null.
for (let i = 0; i < 1000; i++) {
  const len = Math.floor(Math.random() * 50) + 1;
  const input = randomString(len);
  const result = parseHHMM(input);
  assert(result === null, `parseHHMM(random[${len}]) must return null, got ${result}`);
}

// Property check: known-good inputs still parse.
const goodTimes = ["00:00", "09:00", "12:30", "23:59", "24:00", "0:00", "9:5" /* 09:05 parsed as 09:05... actually no, minute needs 2 digits. */];
for (const t of ["00:00", "09:00", "12:30", "23:59", "24:00"]) {
  const result = parseHHMM(t);
  assert(result !== null, `parseHHMM("${t}") must NOT return null for valid input`);
}

// ---------------------------------------------------------------------------
// Run corpus against isAllDayLikeEvent
// ---------------------------------------------------------------------------

console.log("\n=== isAllDayLikeEvent fuzz (corpus) ===");

for (const { start, end } of isAllDayLikeFailures) {
  const result = isAllDayLikeEvent(String(start), String(end));
  assert(result === false, `isAllDayLikeEvent(${JSON.stringify(start)}, ${JSON.stringify(end)}) must return false, got ${result}`);
}

// Randomised fuzz: 1000 random start/end pairs should all return false.
for (let i = 0; i < 1000; i++) {
  const sLen = Math.floor(Math.random() * 80) + 1;
  const eLen = Math.floor(Math.random() * 80) + 1;
  const s = randomString(sLen);
  const e = randomString(eLen);
  const result = isAllDayLikeEvent(s, e);
  assert(result === false, `isAllDayLikeEvent(random[${sLen}], random[${eLen}]) must return false, got ${result}`);
}

// Mixed-mode: start valid ISO, end garbage — must still be false.
for (let i = 0; i < 200; i++) {
  const s = randomDateIso();
  const eLen = Math.floor(Math.random() * 40) + 1;
  const e = Math.random() < 0.5 ? randomString(eLen) : randomDateIso();
  const result = isAllDayLikeEvent(s, e);
  // If end is garbage, must be false. If both are valid, it may legitimately
  // be true (e.g. a real multi-day event), so only assert when end is garbage.
  if (eLen > 0 && !e.includes("T")) {
    assert(result === false, `isAllDayLikeEvent(validIso, garbage) must return false, got ${result}`);
  }
}

// ---------------------------------------------------------------------------
// Known-good inputs must still pass (regression guard)
// ---------------------------------------------------------------------------

console.log("\n=== regression guard (known-good) ===");

// Real 24h event
assert(isAllDayLikeEvent("2026-06-15T00:00:00Z", "2026-06-16T00:00:00Z") === true, "24h event must be all-day");
// Real Google all-day
assert(isAllDayLikeEvent("2026-06-15T00:00:00Z", "2026-06-15T12:00:00Z") === true, "Google all-day must be all-day");
// Normal event must NOT be all-day
assert(isAllDayLikeEvent("2026-06-15T10:00:00Z", "2026-06-15T11:00:00Z") === false, "normal event must not be all-day");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n=== summary ===");
console.log(`Total assertions: ${total}`);
console.log(`Failures:       ${failures}`);

if (failures > 0) {
  console.error("\n❌ FAIL-CLOSED REGRESSION DETECTED");
  process.exit(1);
} else {
  console.log("\n✅ All fail-closed assertions passed");
  process.exit(0);
}
