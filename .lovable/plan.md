

# Complete Push Notification Setup

## Overview
Add the VAPID keys as secrets to enable the instructor push notification system. Once configured, the full gap-filling notification flow will be operational.

## What Will Be Done

### 1. Add VAPID Secrets
Configure two new secrets in the backend:

| Secret Name | Value |
|-------------|-------|
| `VAPID_PUBLIC_KEY` | `BCBfgwQ1iK5LG5Z1EEG5nxRXNIC-ZWHHkYC_FWTcrUV6UiR7yIlFqa-Q5XrE1WPNzLrpbUmQdOBTM4N6Rx7enyA` |
| `VAPID_PRIVATE_KEY` | `g_Ae9o6OvXcMWy4qJk1p1GeeHc9f1d1PsDpyh1jjusw` |

### 2. System Ready
Once added, the complete notification flow will work:
1. Instructor enables push notifications in Settings
2. Instructor sends gap offers via SMS to pupils
3. Pupil replies "yes" via SMS
4. Twilio webhook processes the reply
5. Instructor receives instant push notification

## Technical Details

The following components are already implemented and waiting for these keys:
- Edge function: `get-vapid-key` - serves the public key to browsers
- Edge function: `send-push-notification` - sends notifications using both keys
- Service worker: `public/sw.js` - handles notification display
- Database table: `push_subscriptions` - stores device registrations
- React hooks: `usePushNotifications` - manages subscription flow

## Testing After Setup
1. Log in as an instructor
2. Go to Settings and enable push notifications
3. Send a test gap offer SMS
4. Reply "yes" from the pupil's phone
5. Verify the push notification appears

