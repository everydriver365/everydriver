GRANT SELECT (
  booking_mode,
  cash_payments_enabled,
  klarna_enabled,
  clearpay_enabled,
  instant_bank_pay_enabled,
  school_skim_amount
) ON public.instructors TO anon, authenticated;