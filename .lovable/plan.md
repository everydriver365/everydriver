## Diagnosis

Emails are not failing because DNS is missing. The domain check shows `notify.everydriver.co.uk` is verified and ready.

The failure in the email log is:

```text
403 no_matching_sender: No sender domain matches the requested sender domain
```

Recent email attempts are reaching the queue, then ending in `dlq` after retries. The queued email payload is using `notify.everydriver.co.uk`, but the workspace/project email configuration currently reports the project as configured to use `everydriver.co.uk`. That mismatch is why the sender lookup rejects the send.

I also found that `auth-email-hook` is not present in the codebase, so custom auth email templates have not actually been scaffolded/deployed yet.

## Plan

1. Reconcile the email sender configuration
   - Re-run the managed email infrastructure setup so the project sender config, queue worker, and backend secrets are refreshed against the currently verified EveryDriver email domain.
   - Confirm the configured sender domain matches what the app email function uses.

2. Set up auth email templates properly
   - Scaffold the managed auth email templates for signup confirmation, password reset, magic link, invite, email change, and re-authentication.
   - Apply EveryDriver branding to the generated templates.
   - Deploy the auth email hook.

3. Fix app email sender mismatch if still present
   - If the scaffold/config still points app emails at the wrong domain, update the app email sender configuration to use the verified sender domain consistently.
   - Deploy the affected email functions.

4. Validate with live evidence
   - Send or trigger a single test email.
   - Check the email log for a latest deduplicated `sent` row rather than `dlq`.
   - Check queue/function logs for any remaining rejection.

## Expected result

Auth emails and app emails should send through EveryDriver once the sender domain used by the queued payload matches the verified domain in the backend email configuration.