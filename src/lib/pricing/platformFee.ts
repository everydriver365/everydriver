/**
 * Platform booking fee.
 *
 * A flat £1 fee added to every booking. This is separate from:
 *  - the school skim amount (school's share)
 *  - the Service Fee (payment processing surcharge passed to the pupil)
 *
 * The fee is logged in the `platform_fees` table by the create-booking
 * edge function and reviewed in the admin portal.
 */
export const PLATFORM_FEE_GBP = 1;
