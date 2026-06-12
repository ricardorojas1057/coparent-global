import { ForbiddenException } from '@nestjs/common';
import { FamilyRole, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  const googlePlay = { isConfigured: jest.fn().mockReturnValue(false) };

  it('returns Premium entitlements during the family trial', async () => {
    const prisma = {
      familyMember: {
        findUnique: jest.fn().mockResolvedValue({ role: FamilyRole.PRIMARY_PARENT }),
      },
      familySubscription: {
        upsert: jest.fn().mockResolvedValue({
          id: 'subscription-id',
          familyId: 'family-id',
          plan: SubscriptionPlan.PREMIUM,
          status: SubscriptionStatus.TRIALING,
          provider: 'MANUAL',
          trialEndsAt: new Date(Date.now() + 60_000),
          currentPeriodEndsAt: null,
          cancelAtPeriodEnd: false,
          requestedPlan: null,
          requestedAt: null,
        }),
      },
    };
    const service = new SubscriptionsService(prisma as never, { log: jest.fn() } as never, googlePlay as never);

    await expect(service.getFamilySubscription('family-id', 'user-id')).resolves.toMatchObject({
      effectivePlan: SubscriptionPlan.PREMIUM,
      entitlements: { toneAssistant: true, monthlyExpenseReports: true },
      billing: { familyWide: true },
    });
  });

  it('falls back to Basic after the trial expires', async () => {
    const prisma = {
      familyMember: {
        findUnique: jest.fn().mockResolvedValue({ role: FamilyRole.PRIMARY_PARENT }),
      },
      familySubscription: {
        upsert: jest.fn().mockResolvedValue({
          id: 'subscription-id',
          familyId: 'family-id',
          plan: SubscriptionPlan.PREMIUM,
          status: SubscriptionStatus.TRIALING,
          provider: 'MANUAL',
          trialEndsAt: new Date(Date.now() - 60_000),
          currentPeriodEndsAt: null,
          cancelAtPeriodEnd: false,
          requestedPlan: null,
          requestedAt: null,
        }),
      },
    };
    const service = new SubscriptionsService(prisma as never, { log: jest.fn() } as never, googlePlay as never);

    await expect(service.getFamilySubscription('family-id', 'user-id')).resolves.toMatchObject({
      effectivePlan: SubscriptionPlan.BASIC,
      entitlements: { toneAssistant: false, monthlyExpenseReports: false },
    });
  });

  it('only lets the primary parent request a plan change', async () => {
    const prisma = {
      familyMember: {
        findUnique: jest.fn().mockResolvedValue({ role: FamilyRole.SECONDARY_PARENT }),
      },
      familySubscription: { upsert: jest.fn() },
    };
    const service = new SubscriptionsService(prisma as never, { log: jest.fn() } as never, googlePlay as never);

    await expect(service.requestPlanChange('family-id', SubscriptionPlan.PLUS, 'user-id')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.familySubscription.upsert).not.toHaveBeenCalled();
  });

  it('enforces the Basic plan child limit', async () => {
    const prisma = {
      familyMember: {
        findUnique: jest.fn().mockResolvedValue({ role: FamilyRole.PRIMARY_PARENT }),
      },
      familySubscription: {
        upsert: jest.fn().mockResolvedValue({
          plan: SubscriptionPlan.BASIC,
          status: SubscriptionStatus.ACTIVE,
          trialEndsAt: null,
          currentPeriodEndsAt: null,
        }),
      },
      child: { count: jest.fn().mockResolvedValue(1) },
    };
    const service = new SubscriptionsService(prisma as never, { log: jest.fn() } as never, googlePlay as never);

    await expect(service.assertCanAddChild('family-id', 'user-id')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps a canceled Google Play plan active until its paid period ends', async () => {
    const prisma = {
      familyMember: {
        findUnique: jest.fn().mockResolvedValue({ role: FamilyRole.PRIMARY_PARENT }),
      },
      familySubscription: {
        upsert: jest.fn().mockResolvedValue({
          id: 'subscription-id',
          familyId: 'family-id',
          plan: SubscriptionPlan.PLUS,
          status: SubscriptionStatus.CANCELED,
          provider: 'GOOGLE_PLAY',
          trialEndsAt: null,
          currentPeriodEndsAt: new Date(Date.now() + 60_000),
          cancelAtPeriodEnd: true,
          requestedPlan: null,
          requestedAt: null,
        }),
      },
    };
    const service = new SubscriptionsService(prisma as never, { log: jest.fn() } as never, googlePlay as never);

    await expect(service.getFamilySubscription('family-id', 'user-id')).resolves.toMatchObject({
      effectivePlan: SubscriptionPlan.PLUS,
    });
  });

  it('verifies and activates a Google Play purchase on the backend', async () => {
    const prisma = {
      familyMember: {
        findUnique: jest.fn().mockResolvedValue({ role: FamilyRole.PRIMARY_PARENT }),
      },
      familySubscription: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockImplementation(({ data }) => ({
          id: 'subscription-id',
          familyId: 'family-id',
          ...data,
        })),
      },
    };
    const billing = {
      isConfigured: jest.fn().mockReturnValue(true),
      getSubscription: jest.fn().mockResolvedValue({
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
        subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
        latestOrderId: 'order-id',
        lineItems: [
          {
            productId: 'coparent_family_premium',
            expiryTime: new Date(Date.now() + 60_000).toISOString(),
            offerDetails: { basePlanId: 'monthly' },
            autoRenewingPlan: { autoRenewEnabled: true },
          },
        ],
      }),
      acknowledgeSubscription: jest.fn(),
    };
    const service = new SubscriptionsService(prisma as never, { log: jest.fn() } as never, billing as never);

    const result = await service.verifyGooglePlayPurchase(
      'family-id',
      { productId: 'coparent_family_premium', purchaseToken: 'purchase-token-value' },
      'user-id',
    );
    expect(result).toMatchObject({
      effectivePlan: SubscriptionPlan.PREMIUM,
      subscription: { provider: 'GOOGLE_PLAY', googlePlayBasePlanId: 'monthly' },
    });
    expect(result.subscription).not.toHaveProperty('providerSubscriptionId');
    expect(result.subscription).not.toHaveProperty('latestOrderId');
    expect(billing.acknowledgeSubscription).toHaveBeenCalledWith(
      'coparent_family_premium',
      'purchase-token-value',
      'family-id',
    );
  });
});
