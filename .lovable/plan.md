

## Fix: Pupil Profile Updates Blocked by RLS

**Root Cause**: The pupil portal is accessed anonymously (no auth, just a URL slug). The `pupils` table RLS policies only allow:
- **SELECT** for anonymous users ("Anon can select pupil by id")
- **UPDATE** for authenticated instructors ("Instructors manage own pupils")

So all profile updates — profile picture, DOB, phone, email, address, etc. — silently fail.

### Solution: Create a SECURITY DEFINER function for pupil self-updates

Rather than adding a broad anonymous UPDATE policy (security risk), create a database function that:
1. Takes the pupil ID and a JSONB of allowed field updates
2. Validates only safe fields can be updated (whitelist)
3. Runs as SECURITY DEFINER to bypass RLS
4. Is callable by anonymous users

### Changes

**1. Database migration** — Create `update_pupil_profile` function:
- Accepts `p_pupil_id UUID` and `p_updates JSONB`
- Whitelists only: `profile_image_url`, `date_of_birth`, `driver_number`, `theory_cert_number`, `phone`, `email`, `address`, `postcode`, `pickup_address`, `what3words`
- Uses SECURITY DEFINER to bypass RLS safely
- Returns success/failure

**2. `src/components/pupil-portal/PupilPortalProfileEdit.tsx`** — Update `updateField` to call the RPC function instead of direct `.update()`:
```ts
await supabase.rpc('update_pupil_profile', { 
  p_pupil_id: pupil.id, 
  p_updates: { [field]: value } 
});
```

**3. `src/components/pupil-portal/PupilProfilePictureUpload.tsx`** — Same change for the `profile_image_url` update and removal calls.

This keeps security tight (only whitelisted fields, no broad RLS opening) while allowing anonymous pupil portal users to edit their own profile.

