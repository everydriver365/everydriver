

## Fix: Linked Pupils Section Hidden Inside Commission Panel

### Root Cause
In `AdminInstructorProfile.tsx`, the "Linked Pupils" `SectionPanel` is incorrectly nested inside the "Commission & School" `SectionPanel`. The Commission section is missing its closing `</div></SectionPanel>` tags before the Pupils section begins.

**Current broken structure (lines 378-409):**
```text
<SectionPanel "Commission & School">
  <div class="space-y-1">
    ...edit fields...
    <SectionPanel "Linked Pupils">   ← NESTED INSIDE Commission
      ...pupils list...
    </SectionPanel>
  </div>                             ← closes space-y-1
</SectionPanel>                      ← closes Commission
```

### Fix
Close the Commission section properly before starting the Pupils section:

```text
<SectionPanel "Commission & School">
  <div class="space-y-1">
    ...edit fields...
  </div>                             ← close space-y-1
</SectionPanel>                      ← close Commission

<SectionPanel "Linked Pupils">       ← now at correct level
  ...pupils list...
</SectionPanel>
```

Also remove the duplicate `</div></SectionPanel>` on lines 408-409 which are now extra.

### File to change
- `src/components/admin/AdminInstructorProfile.tsx` — fix closing tags around lines 382-409

