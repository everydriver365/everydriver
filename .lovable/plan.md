

# Add All New Find Nearby Categories

## Changes

### 1. Frontend — `src/pages/InstructorFindNearby.tsx`
Add 9 new categories to the `categories` array. Need to import additional icons from lucide-react (`ShoppingCart`, `Pill`, `Car`, `ParkingSquare`, `CreditCard`, `BatteryCharging`, `Mail`, `Wifi`, `Wrench`).

New categories:
- `supermarket` — Supermarkets (ShoppingCart, green)
- `pharmacy` — Pharmacies (Pill, pink)
- `car-wash` — Car Wash (Car, blue)
- `parking` — Parking (ParkingSquare, slate)
- `coffee` — Coffee Shops (Coffee icon reused, brown)
- `garage` — Tyre & Garage (Wrench, orange)
- `atm` — ATMs (CreditCard, indigo)
- `ev-charging` — EV Charging (BatteryCharging, lime)
- `post-office` — Post Office (Mail, red)

### 2. Edge Function — `supabase/functions/google-places-nearby/index.ts`
Add matching entries to the `categoryMap`:
```typescript
supermarket: { type: "supermarket" },
pharmacy: { type: "pharmacy" },
"car-wash": { keyword: "car wash" },
parking: { type: "parking" },
coffee: { type: "cafe", keyword: "coffee" },
garage: { keyword: "tyre garage car repair" },
atm: { type: "atm" },
"ev-charging": { keyword: "electric vehicle charging station" },
"post-office": { keyword: "post office" },
```

### 2 files to edit, no database changes needed.

