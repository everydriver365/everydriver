-- Fix 1: invoke-radius-poller-30s — 30 seconds is not a valid pg_cron expression, change to every minute
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'invoke-radius-poller-30s'),
  schedule := '* * * * *'
);

-- Fix 2: process-email-queue — 5 seconds is not a valid pg_cron expression, change to every minute
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue'),
  schedule := '* * * * *'
);

-- Fix 3: Remove duplicate process-notification-digest job (older name)
SELECT cron.unschedule('process-notification-digest-15m');

-- Fix 4: Remove duplicate send-daily-summary job (older name)
SELECT cron.unschedule('send-daily-summary-15m');

-- Fix 5: Remove duplicate hourly account-deletions job (daily at 2am already exists)
SELECT cron.unschedule('process-account-deletions-hourly');
