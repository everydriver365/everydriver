
# Add Sinotrack ST-902L Setup Instructions

This plan adds a dedicated collapsible section for configuring the Sinotrack ST-902L hardware GPS tracker with copyable SMS commands.

## Overview

The ST-902L is an OBD-II hardware tracker that provides more reliable GPS tracking than phone apps by bypassing mobile OS background restrictions. Users configure it by sending SMS commands to the device's SIM card number.

## What Will Be Added

A new **"Hardware Tracker Setup"** card with an accordion containing:

1. **Device Overview** - What the ST-902L is and where to plug it in
2. **Prerequisites Checklist** - SIM card requirements and device ID creation reminder
3. **Step-by-Step SMS Commands** - Each with a copy button:
   - `804 qyqeibovdhyohkfagujv.supabase.co 443` - Set server domain and HTTPS port
   - `805 [DEVICE_ID]` - Set the device identifier (user substitutes their ID)
   - `710 5` - Set update frequency to 5 seconds
   - `711 10` - Set distance threshold to 10 meters
   - `RESET#` - Restart device to apply settings
4. **Verification Instructions** - How to confirm the device is connected
5. **Troubleshooting Tips** - Common issues and solutions

## UI Design

- Uses the existing `Accordion` component for clean expandable sections
- Each SMS command has a copy button using existing `copyToClipboard` pattern
- New state variable `copiedSms` to track which command was copied
- Styled consistently with existing cards using the project's Card components
- Includes a `Cpu` icon from lucide-react to differentiate from phone setup

## Placement

The new card will appear **after** the "How It Works" card and **before** the "Server URL" card, making it easy to find for hardware tracker users while keeping phone app instructions prominent.

---

## Technical Details

### File Modified
`src/pages/InstructorTraccarSetup.tsx`

### New Imports
```typescript
import { Cpu, MessageSquare } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
```

### New State
```typescript
const [copiedSms, setCopiedSms] = useState<string | null>(null);
```

### SMS Commands Configuration
```typescript
const smsCommands = [
  { 
    id: "server", 
    command: "804 qyqeibovdhyohkfagujv.supabase.co 443", 
    description: "Set server domain and HTTPS port" 
  },
  { 
    id: "device", 
    command: "805 [YOUR_DEVICE_ID]", 
    description: "Set device identifier (replace with your Device ID)" 
  },
  { 
    id: "frequency", 
    command: "710 5", 
    description: "Set update frequency to 5 seconds" 
  },
  { 
    id: "distance", 
    command: "711 10", 
    description: "Set distance threshold to 10 meters" 
  },
  { 
    id: "reset", 
    command: "RESET#", 
    description: "Restart device to apply settings" 
  },
];
```

### Copy Function Enhancement
Extended to handle SMS commands with visual feedback.

### New Card Component
A Card with Accordion containing the full setup guide, placed between "How It Works" and "Server URL" cards.
