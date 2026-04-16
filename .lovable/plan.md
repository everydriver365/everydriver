

# Plan: Stop Auto-Session Creation in Radius Poller

## Problem
The `radius-poller` edge function (lines 591-626) automatically creates a new tracking session whenever the GPS device reports ignition ON and no active session exists. This means every time you start your car, tracking begins without you pressing anything. The only guard is a 60-second cooldown after manually ending a session — far too short.

## Solution
Remove the auto-create session logic entirely from the radius poller. Sessions should only be created when the instructor explicitly taps "Start Session" in the app. The poller should still:
- Record GPS points to an existing active session
- Auto-end non-manual sessions when ignition turns OFF
- Update device location/speed regardless of session state

## Changes

### 1. `supabase/functions/radius-poller/index.ts`
- **Remove lines 591-627** — the entire "Auto-create session if ignition ON and no active session" block
- GPS points will still be recorded if a session already exists (manually started)
- Auto-end logic (lines 629-660) stays, but only for non-manually-started sessions

This is a single-file change to the edge function, which will be redeployed automatically.

