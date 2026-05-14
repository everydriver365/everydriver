## Plan: make public course booking consistent

### What I found
- Website visitors are not logged in, but the public courses and booking screens still call protected data directly.
- Ken’s courses do exist and are active, but anonymous requests for existing lesson blocks/manual blocks/instructor preferences fail with 401 errors.
- That means the page can show stale or false availability, and a later booking step can contradict the course list.

### Fix
1. **Use one safe public availability layer**
   - Keep private lesson/pupil/block data protected.
   - Use public backend functions that return only the minimum scheduling fields needed by visitors:
     - instructor id
     - lesson date
     - lesson start time
     - lesson duration
     - manual block start/end time
     - public booking preference
     - public online presence timestamp

2. **Stop anonymous pages calling protected tables**
   - Update public course discovery to load lesson blocks/manual blocks through the safe public functions.
   - Update the booking slot picker to use the same safe functions.
   - Update chat online-status fallback to use the safe public presence function.
   - Update auto-scheduling preference lookup to use the safe public preference function.

3. **Make course list and booking page agree**
   - Course calendar dots, course cards, and booking slot selection will use the same public-safe availability source.
   - Existing bookings and manual blocks will be respected for visitors without exposing private customer data.

4. **Verify on Ken’s public path**
   - Test `/i/ken-d/courses` as an anonymous visitor.
   - Confirm no 401 requests remain for protected tables.
   - Confirm Ken’s course cards show and the Book Now page loads its slot picker consistently.

### Technical notes
- I already created the safe backend functions needed for this; the remaining implementation is frontend rewiring.
- I will not make private tables publicly readable.
- I will not add mock data or hard-coded course fallbacks.