# Monetization

Coparent Global uses one subscription per family. Parents and authorized family
members share the same plan, so a family is never charged twice for the same
workspace.

## Launch plans

| Plan | Monthly USD | Annual USD | Purpose |
| --- | ---: | ---: | --- |
| Basic Access | 0 | 0 | Core calendar, expenses and family messaging |
| Family Plus | 6.99 | 67.08 | Receipts, monthly reports and offline preparation |
| Family Premium | 12.99 | 124.68 | Conflict-reduction tools, verified history and guest links |
| Professional | 29.99 | 287.88 | Professional collaboration and advanced family support |

New and existing families receive a 30-day Family Premium trial. At the end of
the trial, a family without an active purchase returns to Basic Access.

## Google Play products

Create these subscriptions in Google Play Console:

- `coparent_family_plus`: Family Plus
- `coparent_family_premium`: Family Premium
- `coparent_professional`: Professional

Each subscription must have auto-renewing base plans named `monthly` and
`annual`. Google Play is the source of truth for localized prices and taxes.

## Billing integration contract

1. Android starts the purchase with Google Play Billing.
2. The app sends the purchase token and product ID to NestJS.
3. NestJS verifies the purchase with the Google Play Developer API.
4. Only the backend updates `FamilySubscription`.
5. Real-time developer notifications keep renewals, cancellations and payment
   failures synchronized.

The backend implements purchase-token verification, server-side
acknowledgement and authenticated RTDN processing. Keep
`GOOGLE_PLAY_BILLING_ENABLED=false` until all three products, service-account
permissions and Pub/Sub push authentication are configured.

## Required production variables

- `GOOGLE_PLAY_PACKAGE_NAME=ar.coparent.app`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: complete service-account JSON, stored as
  a sensitive Vercel variable.
- `GOOGLE_PLAY_PUBSUB_AUDIENCE`: exact public RTDN endpoint URL.
- `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL`: identity used by Pub/Sub push.
- `GOOGLE_PLAY_BILLING_ENABLED=true`: enable only after a license-tester
  purchase is verified.

RTDN endpoint:

`POST https://coparent-argentina-api.vercel.app/subscriptions/google-play/notifications`

The backend Vercel build runs `prisma migrate deploy` before compiling. This
keeps subscription code from reaching production before its database migration
has completed.
