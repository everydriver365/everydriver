

# Quartix QWS V2 Integration Plan

## What We're Building

Connecting your app to the real Quartix API so you get live vehicle positions, trip history, and driving style scores flowing into your existing dashboards and maps automatically.

## How Quartix Authentication Works

Unlike a simple API key, Quartix uses a login-based system. Your app will sign in with your Quartix credentials (Customer ID, Username, Password) and receive temporary access tokens. These tokens expire, so the system handles refreshing them automatically.

## What You'll Need to Provide

Three secrets for your Quartix account:
- **QUARTIX_CUSTOMER_ID** -- your subscriber/customer ID
- **QUARTIX_USERNAME** -- your Quartix login username
- **QUARTIX_PASSWORD** -- your Quartix login password

The API base URL (`https://qws.quartix.net/v2/api`) will be hardcoded since you're a UK user.

## Implementation Steps

### Step 1: Store Quartix Credentials

Save three new secrets (QUARTIX_CUSTOMER_ID, QUARTIX_USERNAME, QUARTIX_PASSWORD) and remove the old placeholder secrets (QUARTIX_API_KEY, QUARTIX_ACCOUNT_ID, QUARTIX_API_URL) that assumed a different auth model.

### Step 2: Rewrite the Quartix Poller Edge Function

Replace the placeholder `quartix-poller` with real API calls:

1. **Authenticate** -- POST to `/auth` with CustomerID, UserName, Password to get an AccessToken
2. **Fetch live positions** -- GET `/vehicles/live` using the AccessToken header, returning Latitude, Longitude, Speed, Heading, LocationText for each vehicle
3. **Match vehicles to devices** -- Map each Quartix VehicleID to existing `gps_devices` rows via the `quartix_vehicle_id` column
4. **Update device positions** -- Write lat/lng/speed/heading/last_seen_at into `gps_devices` for each matched vehicle
5. **Fetch driving style scores** -- GET `/vehicles/tripsummary` with `Include=drivingStyle` and `GroupBy=vehicle`, then upsert into `quartix_driver_scores` mapping Braking.Score, Accel.Score, RelativeSpeed.Score, and overall Score

### Step 3: Rewrite the Quartix Trips Edge Function

Replace the placeholder `quartix-trips` with real API calls:

1. **Authenticate** (same as above)
2. **Fetch trips** -- GET `/vehicles/trips?VehicleIDList={id}&StartDay={from}&EndDay={to}&Include=drivingStyle`
3. **Return trip data** including start/end locations, distance, travel time, avg/max speed, and driving style scores

### Step 4: Add a Vehicle Route Endpoint (New Edge Function)

Create `quartix-route` to power the existing Trip Replay feature:

1. **Authenticate**
2. **Fetch route** -- GET `/vehicles/route?VehicleID={id}&StartDay={date}`
3. **Return route hops** with Latitude, Longitude, Heading, Speed, SpeedLimit, EventType, Location, and driving style data per hop

### Step 5: Auto-Sync Vehicles on First Connect

Add logic in the poller to call GET `/vehicles` and automatically register any new Quartix vehicles as `gps_devices` entries, so instructors don't have to manually add them.

---

## Technical Details

### Authentication Helper (shared across all edge functions)

```text
POST https://qws.quartix.net/v2/api/auth
Body: CustomerID, UserName, Password (form data)
Response: { Data: { AccessToken, RefreshToken } }

All subsequent calls use header: AccessToken: {token}
```

### Key API Endpoints Used

| Feature | Endpoint | Data Returned |
|---------|----------|--------------|
| Live positions | GET /vehicles/live | VehicleID, Lat, Lng, Speed, Heading, LocationText |
| Trip list | GET /vehicles/trips | Start/End times, locations, distance, driving style |
| Route replay | GET /vehicles/route | Per-hop lat/lng/speed/speedLimit/events |
| Trip summary + scores | GET /vehicles/tripsummary?Include=drivingStyle | Distance, travel time, braking/accel/speed scores |
| Vehicle list | GET /vehicles | VehicleID, RegistrationNumber, Description |

### Database Mapping

The existing `gps_devices` table already has `quartix_vehicle_id` and `quartix_driver_id` columns. The existing `quartix_driver_scores` table maps directly to the DrivingStyle scores from the API (Braking.Score, Accel.Score, RelativeSpeed.Score).

### What Changes vs. What Stays

- **Stays the same**: All UI components (maps, dashboards, score leaderboards, trip replay) -- they already read from the right tables
- **Changes**: The three edge functions get rewritten with real Quartix API calls instead of placeholder comments
- **New**: One new `quartix-route` edge function for detailed route/hop data
- **Removed**: References to old QUARTIX_API_KEY/QUARTIX_API_URL/QUARTIX_ACCOUNT_ID secrets

