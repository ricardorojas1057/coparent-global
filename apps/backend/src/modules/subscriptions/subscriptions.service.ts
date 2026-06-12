import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { FamilyRole, SubscriptionPlan, SubscriptionProvider, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GooglePlayBillingService, GooglePlaySubscriptionPurchase } from './google-play-billing.service';
import { VerifyGooglePlayPurchaseDto } from './subscriptions.dto';
import { GOOGLE_PLAY_PRODUCT_PLANS, PLAN_CATALOG, PLAN_ENTITLEMENTS, PlanEntitlement } from './plans';

const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly googlePlay: GooglePlayBillingService,
  ) {}

  async getFamilySubscription(familyId: string, userId: string) {
    await this.assertMembership(familyId, userId);
    const subscription = await this.ensureSubscription(familyId);
    return this.toPublicState(subscription);
  }

  async requestPlanChange(familyId: string, requestedPlan: SubscriptionPlan, userId: string) {
    const membership = await this.assertMembership(familyId, userId);
    if (membership.role !== FamilyRole.PRIMARY_PARENT) {
      throw new ForbiddenException('Solo el progenitor principal puede administrar el plan familiar.');
    }

    const subscription = await this.prisma.familySubscription.upsert({
      where: { familyId },
      update: { requestedPlan, requestedAt: new Date() },
      create: {
        familyId,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
        requestedPlan,
        requestedAt: new Date(),
      },
    });
    await this.audit.log({
      userId,
      familyId,
      action: 'REQUEST_SUBSCRIPTION_PLAN',
      entity: 'FamilySubscription',
      entityId: subscription.id,
      metadata: { requestedPlan },
    });
    return this.toPublicState(subscription);
  }

  async verifyGooglePlayPurchase(familyId: string, dto: VerifyGooglePlayPurchaseDto, userId: string) {
    const membership = await this.assertMembership(familyId, userId);
    if (membership.role !== FamilyRole.PRIMARY_PARENT) {
      throw new ForbiddenException('Solo el progenitor principal puede administrar el plan familiar.');
    }
    if (!this.googlePlay.isConfigured()) {
      throw new BadRequestException('Google Play Billing todavia no esta habilitado.');
    }

    const linkedSubscription = await this.prisma.familySubscription.findUnique({
      where: { providerSubscriptionId: dto.purchaseToken },
    });
    if (linkedSubscription && linkedSubscription.familyId !== familyId) {
      throw new ConflictException('Esta compra ya esta vinculada a otra familia.');
    }

    const purchase = await this.googlePlay.getSubscription(dto.purchaseToken);
    const subscription = await this.syncGooglePlayPurchase(familyId, dto.purchaseToken, purchase, dto.productId);
    if (purchase.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
      await this.googlePlay.acknowledgeSubscription(dto.productId, dto.purchaseToken, familyId);
    }
    await this.audit.log({
      userId,
      familyId,
      action: 'VERIFY_GOOGLE_PLAY_SUBSCRIPTION',
      entity: 'FamilySubscription',
      entityId: subscription.id,
      metadata: {
        productId: subscription.googlePlayProductId,
        basePlanId: subscription.googlePlayBasePlanId,
        status: subscription.status,
      },
    });
    return this.toPublicState(subscription);
  }

  async syncGooglePlayNotification(authorization: string | undefined, body: unknown) {
    await this.googlePlay.verifyPubSubAuthorization(authorization);
    const notification = this.googlePlay.decodeNotification(body);
    if (notification.packageName !== process.env.GOOGLE_PLAY_PACKAGE_NAME) {
      throw new BadRequestException('La notificacion pertenece a otra aplicacion.');
    }
    if (notification.testNotification) return { test: true };

    const purchaseToken = notification.subscriptionNotification?.purchaseToken;
    if (!purchaseToken) throw new BadRequestException('La notificacion no incluye una suscripcion.');
    const linkedSubscription = await this.prisma.familySubscription.findUnique({
      where: { providerSubscriptionId: purchaseToken },
    });
    if (!linkedSubscription) return { ignored: true };

    const purchase = await this.googlePlay.getSubscription(purchaseToken);
    const subscription = await this.syncGooglePlayPurchase(
      linkedSubscription.familyId,
      purchaseToken,
      purchase,
      notification.subscriptionNotification?.subscriptionId,
    );
    const primaryParent = await this.prisma.familyMember.findFirst({
      where: { familyId: linkedSubscription.familyId, role: FamilyRole.PRIMARY_PARENT },
    });
    if (primaryParent) {
      await this.audit.log({
        userId: primaryParent.userId,
        familyId: linkedSubscription.familyId,
        action: 'SYNC_GOOGLE_PLAY_SUBSCRIPTION',
        entity: 'FamilySubscription',
        entityId: subscription.id,
        metadata: {
          notificationType: notification.subscriptionNotification?.notificationType,
          status: subscription.status,
        },
      });
    }
    return { processed: true };
  }

  async assertEntitlement(familyId: string, userId: string, entitlement: PlanEntitlement) {
    if (await this.hasEntitlement(familyId, userId, entitlement)) return;
    throw new ForbiddenException('Esta funcion requiere un plan superior.');
  }

  async hasEntitlement(familyId: string, userId: string, entitlement: PlanEntitlement) {
    await this.assertMembership(familyId, userId);
    const subscription = await this.ensureSubscription(familyId);
    const effectivePlan = this.effectivePlan(subscription);
    return PLAN_ENTITLEMENTS[effectivePlan][entitlement];
  }

  async assertCanAddChild(familyId: string, userId: string) {
    await this.assertMembership(familyId, userId);
    const subscription = await this.ensureSubscription(familyId);
    const maxChildren = PLAN_ENTITLEMENTS[this.effectivePlan(subscription)].maxChildren;
    if (maxChildren === null) return;

    const childrenCount = await this.prisma.child.count({ where: { familyId } });
    if (childrenCount >= maxChildren) {
      throw new ForbiddenException('El plan Basico permite un hijo/a. Actualiza el plan familiar para agregar mas.');
    }
  }

  private async ensureSubscription(familyId: string) {
    return this.prisma.familySubscription.upsert({
      where: { familyId },
      update: {},
      create: {
        familyId,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
      },
    });
  }

  private effectivePlan(subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trialEndsAt: Date | null;
    currentPeriodEndsAt: Date | null;
  }) {
    const now = Date.now();
    if (subscription.status === SubscriptionStatus.TRIALING) {
      return subscription.trialEndsAt && subscription.trialEndsAt.getTime() > now
        ? subscription.plan
        : SubscriptionPlan.BASIC;
    }
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return subscription.currentPeriodEndsAt && subscription.currentPeriodEndsAt.getTime() <= now
        ? SubscriptionPlan.BASIC
        : subscription.plan;
    }
    if (subscription.status === SubscriptionStatus.CANCELED) {
      return subscription.currentPeriodEndsAt && subscription.currentPeriodEndsAt.getTime() > now
        ? subscription.plan
        : SubscriptionPlan.BASIC;
    }
    return SubscriptionPlan.BASIC;
  }

  private toPublicState(subscription: {
    id: string;
    familyId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    provider: string;
    googlePlayProductId: string | null;
    googlePlayBasePlanId: string | null;
    lastVerifiedAt: Date | null;
    trialEndsAt: Date | null;
    currentPeriodEndsAt: Date | null;
    cancelAtPeriodEnd: boolean;
    requestedPlan: SubscriptionPlan | null;
    requestedAt: Date | null;
  }) {
    const effectivePlan = this.effectivePlan(subscription);
    return {
      subscription: {
        id: subscription.id,
        familyId: subscription.familyId,
        plan: subscription.plan,
        status: subscription.status,
        provider: subscription.provider,
        googlePlayProductId: subscription.googlePlayProductId,
        googlePlayBasePlanId: subscription.googlePlayBasePlanId,
        lastVerifiedAt: subscription.lastVerifiedAt,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEndsAt: subscription.currentPeriodEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        requestedPlan: subscription.requestedPlan,
        requestedAt: subscription.requestedAt,
      },
      effectivePlan,
      entitlements: PLAN_ENTITLEMENTS[effectivePlan],
      catalog: PLAN_CATALOG,
      billing: {
        googlePlayReady: this.googlePlay.isConfigured(),
        familyWide: true,
      },
    };
  }

  private async syncGooglePlayPurchase(
    familyId: string,
    purchaseToken: string,
    purchase: GooglePlaySubscriptionPurchase,
    expectedProductId?: string,
  ) {
    const lineItem =
      purchase.lineItems?.find((item) => item.productId === expectedProductId) ??
      purchase.lineItems?.slice().sort((left, right) => {
        return new Date(right.expiryTime ?? 0).getTime() - new Date(left.expiryTime ?? 0).getTime();
      })[0];
    if (!lineItem?.productId || !lineItem.expiryTime) {
      throw new BadRequestException('Google Play no devolvio una suscripcion valida.');
    }
    const plan = GOOGLE_PLAY_PRODUCT_PLANS[lineItem.productId];
    if (!plan || (expectedProductId && lineItem.productId !== expectedProductId)) {
      throw new BadRequestException('El producto comprado no corresponde a un plan disponible.');
    }

    const status = this.googlePlayStatus(purchase.subscriptionState);
    if (status === SubscriptionStatus.PAST_DUE && purchase.subscriptionState === 'SUBSCRIPTION_STATE_PENDING_PURCHASE') {
      throw new BadRequestException('El pago sigue pendiente. Los beneficios se activaran cuando Google lo confirme.');
    }

    return this.prisma.familySubscription.update({
      where: { familyId },
      data: {
        plan,
        status,
        provider: SubscriptionProvider.GOOGLE_PLAY,
        providerSubscriptionId: purchaseToken,
        googlePlayProductId: lineItem.productId,
        googlePlayBasePlanId: lineItem.offerDetails?.basePlanId,
        latestOrderId: purchase.latestOrderId,
        lastVerifiedAt: new Date(),
        trialEndsAt: null,
        currentPeriodEndsAt: new Date(lineItem.expiryTime),
        cancelAtPeriodEnd:
          status === SubscriptionStatus.CANCELED || lineItem.autoRenewingPlan?.autoRenewEnabled === false,
        requestedPlan: null,
        requestedAt: null,
      },
    });
  }

  private googlePlayStatus(state?: string) {
    if (state === 'SUBSCRIPTION_STATE_ACTIVE' || state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD') {
      return SubscriptionStatus.ACTIVE;
    }
    if (state === 'SUBSCRIPTION_STATE_CANCELED') return SubscriptionStatus.CANCELED;
    if (state === 'SUBSCRIPTION_STATE_EXPIRED') return SubscriptionStatus.EXPIRED;
    return SubscriptionStatus.PAST_DUE;
  }

  private async assertMembership(familyId: string, userId: string) {
    const membership = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!membership) throw new ForbiddenException('No integras esta familia.');
    return membership;
  }
}
