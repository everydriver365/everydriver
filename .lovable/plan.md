

## Update Elavon Credentials

You've provided four new Cardstream/Elavon credentials. The code uses two of them directly (`ELAVON_MERCHANT_ALIAS` and `ELAVON_SECRET_KEY`) across five edge functions. The other two (`ELAVON_PROCESSOR_ID` and `ELAVON_PUBLIC_KEY`) are stored as secrets but not currently referenced in code -- they should still be updated for completeness.

### Plan

1. **Update four secrets** with the new values:
   - `ELAVON_MERCHANT_ALIAS` → `kdmdvcm76qqkvbh378dxr3f7g447`
   - `ELAVON_SECRET_KEY` → `sk_9mvcwpj93jg8bh2t9jcj7y6636t3`
   - `ELAVON_PROCESSOR_ID` → `qytrqgpm2py7phkx9fvmtjrdv9gv`
   - `ELAVON_PUBLIC_KEY` → `pk_g9gc3tj9vmfgd8r3y94d3wdww8fm`

No code changes needed -- the edge functions already read these from environment variables.

