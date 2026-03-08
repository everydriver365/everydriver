

# Pre-Rork Checklist

Your Lovable backend is already set up to work with Rork -- both apps talk to the same database. But there are a few things worth tidying up first:

## 1. Remove Capacitor setup (cleanup)
The `capacitor.config.ts` file and Capacitor dependencies (`@capacitor/core`, `@capacitor/android`) were added earlier but are no longer needed since you're going with Rork instead. Removing them keeps the project clean.

## 2. Verify your Rork prompt blueprint is current
Based on project memory, you have a comprehensive Rork prompt covering 6-tab navigation, 100+ tables, and 90+ edge functions. Before starting in Rork, we should review it to make sure it includes any features added since it was last updated (1 day ago).

## 3. Gather the two credentials Rork needs
The Rork app needs exactly two values to connect to your backend:
- **API URL** -- already available in your project settings
- **Anon Key** -- already available in your project settings

These are not secrets; they're public/publishable values that Rork uses to talk to your database (RLS policies protect the data).

## 4. Nothing else required on the backend
- Auth is already configured
- RLS policies are in place on all tables
- Edge functions are deployed and working
- Realtime is enabled on relevant tables
- Storage buckets exist for images/files

## Summary of changes
- Remove `capacitor.config.ts` and uninstall `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`
- Optionally review/export the Rork prompt blueprint one final time

Everything else is ready -- your backend doesn't need any modifications for Rork to consume it.

