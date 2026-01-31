
# Update Terms of Service for Google OAuth Compliance

## Overview
Update the Terms of Service page with specific Google Calendar integration disclosures required for Google OAuth verification. This includes data access transparency, Limited Use policy compliance, and user control information.

## Full Updated Terms of Service Text

The following is the complete updated Terms of Service with the new **Section 7: Google Calendar Integration** that meets Google's verification requirements:

---

### Terms of Service

**Last updated: 31 January 2026**

#### 1. Agreement to Terms

By accessing or using EveryDriver ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.

#### 2. Description of Service

EveryDriver is a platform that connects learner drivers with driving instructors, facilitating the booking and management of driving lessons. We provide tools for scheduling, payment processing, and progress tracking.

#### 3. User Accounts

- You must provide accurate and complete information when creating an account
- You are responsible for maintaining the security of your account credentials
- You must notify us immediately of any unauthorised access to your account
- You may not use another person's account without permission

#### 4. Instructor Responsibilities

Instructors using our platform agree to:
- Hold a valid ADI (Approved Driving Instructor) licence
- Maintain appropriate insurance for driving instruction
- Provide accurate availability and pricing information
- Honour confirmed bookings or provide reasonable notice for cancellations
- Conduct lessons professionally and safely

#### 5. Learner Responsibilities

Learners using our platform agree to:
- Hold a valid provisional driving licence before taking lessons
- Arrive on time for scheduled lessons
- Provide adequate notice for cancellations as per instructor policy
- Make payments as agreed for booked lessons
- Follow instructor guidance during lessons

#### 6. Bookings and Payments

- Lesson prices are set by individual instructors
- Payment terms are agreed between learners and instructors
- Cancellation policies vary by instructor and are displayed at booking
- We facilitate payments but are not responsible for disputes between users

#### 7. Google Calendar Integration

EveryDriver offers optional integration with Google Calendar to help instructors manage their lesson availability. This section explains how we access and use your Google account data.

**Data We Access**

When you connect your Google Calendar to EveryDriver, we request access to:
- **Calendar events**: Read and write access to create, update, and delete lesson bookings
- **Email address**: To identify your Google account and link it to your EveryDriver profile

**How We Use Your Data**

We use your Google Calendar data solely to:
- Sync your lesson bookings between EveryDriver and Google Calendar
- Display your existing calendar events to prevent double-booking
- Create new calendar events when lessons are booked
- Update or remove calendar events when lessons are modified or cancelled

**Data Storage and Security**

- Your Google account credentials (OAuth tokens) are encrypted and stored securely
- We do not store the content of your personal calendar events on our servers
- Calendar data is fetched in real-time when you use the scheduling features
- Your data is transmitted using industry-standard HTTPS encryption

**What We Do NOT Do**

- We do **not** sell your Google data to third parties
- We do **not** use your Google data for advertising purposes
- We do **not** share your Google data with other users or external services
- We do **not** access calendars or data beyond what is necessary for lesson scheduling

**Google API Services User Data Policy Compliance**

EveryDriver's use and transfer of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

**Revoking Access**

You can disconnect your Google Calendar from EveryDriver at any time by:
1. Going to **Settings > Integrations** in your EveryDriver account and clicking "Disconnect"
2. Visiting your [Google Account permissions](https://myaccount.google.com/permissions) and removing EveryDriver access

Upon disconnection, we will delete your stored OAuth tokens. Existing calendar events created by EveryDriver will remain in your Google Calendar unless you manually delete them.

#### 8. Other Third-Party Integrations

Our Service may integrate with additional third-party services. By connecting these services, you agree to their respective terms of service. We are not responsible for the availability or functionality of third-party services.

#### 9. Intellectual Property

The Service and its original content, features, and functionality are owned by EveryDriver and are protected by international copyright, trademark, and other intellectual property laws.

#### 10. Limitation of Liability

EveryDriver acts as a platform connecting instructors and learners. We are not liable for:
- The quality of driving instruction provided
- Accidents or incidents during lessons
- Disputes between instructors and learners
- Loss of data or service interruptions

#### 11. Termination

We may terminate or suspend your account at any time for violations of these terms. You may also close your account at any time by contacting us.

#### 12. Changes to Terms

We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.

#### 13. Governing Law

These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.

#### 14. Contact Us

If you have questions about these Terms of Service, please contact us at:

Email: legal@everydriver.co.uk  
Phone: 0800 123 4567

See also our Privacy Policy.

---

## Key Google OAuth Compliance Elements

| Requirement | Where Addressed |
|------------|-----------------|
| Data access transparency | "Data We Access" section |
| Purpose of data use | "How We Use Your Data" section |
| Limited Use policy statement | Explicit compliance statement with link |
| No selling/advertising clause | "What We Do NOT Do" section |
| Revocation instructions | "Revoking Access" section with steps |
| Security measures | "Data Storage and Security" section |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/TermsOfService.tsx` | Add new Section 7 for Google Calendar, renumber subsequent sections |
| `public/terms-of-service/index.html` | Update static HTML version with same content |

## Implementation

The update adds approximately 40 lines of new content focused specifically on Google Calendar integration transparency, which is the primary requirement for passing Google's OAuth verification audit.
