
# Update UI Text for Hardware Tracker (ST-902L)

Since you're now exclusively using the ST-902L hardware tracker instead of the phone-based Traccar Client app, I'll update all the outdated messaging across the application.

## Files to Update

### 1. InstructorTraccarSession.tsx (Line 747)
**Current**: "Device not connected – start Traccar Client on your phone"
**New**: "Device not connected – check your ST-902L tracker"

### 2. InstructorSettings.tsx (Lines 689-691)  
**Current**: "Use the Traccar Client app on your phone for reliable background GPS tracking during lessons. Works even when screen is off."
**New**: "Use the ST-902L OBD-II tracker for reliable GPS tracking during lessons. Plugs directly into your vehicle's diagnostic port."

### 3. TraccarConnectionChecklist.tsx (Lines 78-81)
**Current instructions**:
1. Open the Traccar Client app on your phone
2. Toggle "Service status" to ON
3. Ensure GPS/Location is enabled

**New instructions**:
1. Ensure your ST-902L is plugged into the OBD-II port
2. Check the tracker LED is on (power from vehicle)
3. Verify SIM card has data enabled

Also update the icon from `Smartphone` to `Cpu` to better represent hardware.

## Summary
- 3 files modified
- All phone app references replaced with hardware tracker messaging
- Icon updated from phone to hardware chip
