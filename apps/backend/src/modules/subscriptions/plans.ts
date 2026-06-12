import { SubscriptionPlan } from '@prisma/client';

export const GOOGLE_PLAY_PRODUCT_PLANS: Record<string, SubscriptionPlan> = {
  coparent_family_plus: SubscriptionPlan.PLUS,
  coparent_family_premium: SubscriptionPlan.PREMIUM,
  coparent_professional: SubscriptionPlan.PROFESSIONAL,
};

export type PlanEntitlements = {
  maxChildren: number | null;
  monthlyExpenseReports: boolean;
  receiptManagement: boolean;
  offlineSync: boolean;
  toneAssistant: boolean;
  verifiedAuditExports: boolean;
  secureGuestLinks: boolean;
  professionalAccess: boolean;
};

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  [SubscriptionPlan.BASIC]: {
    maxChildren: 1,
    monthlyExpenseReports: false,
    receiptManagement: false,
    offlineSync: false,
    toneAssistant: false,
    verifiedAuditExports: false,
    secureGuestLinks: false,
    professionalAccess: false,
  },
  [SubscriptionPlan.PLUS]: {
    maxChildren: null,
    monthlyExpenseReports: true,
    receiptManagement: true,
    offlineSync: true,
    toneAssistant: false,
    verifiedAuditExports: false,
    secureGuestLinks: false,
    professionalAccess: false,
  },
  [SubscriptionPlan.PREMIUM]: {
    maxChildren: null,
    monthlyExpenseReports: true,
    receiptManagement: true,
    offlineSync: true,
    toneAssistant: true,
    verifiedAuditExports: true,
    secureGuestLinks: true,
    professionalAccess: false,
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    maxChildren: null,
    monthlyExpenseReports: true,
    receiptManagement: true,
    offlineSync: true,
    toneAssistant: true,
    verifiedAuditExports: true,
    secureGuestLinks: true,
    professionalAccess: true,
  },
};

export type PlanEntitlement = Exclude<keyof PlanEntitlements, 'maxChildren'>;

export const PLAN_CATALOG = [
  {
    plan: SubscriptionPlan.BASIC,
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    recommended: false,
    contactSales: false,
    googlePlayProductId: null,
    featureCodes: ['familyCore', 'sharedCalendar', 'secureMessages', 'basicExpenses', 'notifications'],
  },
  {
    plan: SubscriptionPlan.PLUS,
    monthlyPriceUsd: 6.99,
    annualPriceUsd: 67.08,
    recommended: false,
    contactSales: false,
    googlePlayProductId: 'coparent_family_plus',
    featureCodes: ['plusEverythingBasic', 'unlimitedChildren', 'receipts', 'monthlyReports', 'offlineSync'],
  },
  {
    plan: SubscriptionPlan.PREMIUM,
    monthlyPriceUsd: 12.99,
    annualPriceUsd: 124.68,
    recommended: true,
    contactSales: false,
    googlePlayProductId: 'coparent_family_premium',
    featureCodes: ['premiumEverythingPlus', 'toneAssistant', 'verifiedHistory', 'professionalExports', 'secureGuestLinks'],
  },
  {
    plan: SubscriptionPlan.PROFESSIONAL,
    monthlyPriceUsd: 29.99,
    annualPriceUsd: 287.88,
    recommended: false,
    contactSales: false,
    googlePlayProductId: 'coparent_professional',
    featureCodes: ['professionalEverythingPremium', 'multiFamilyWorkspace', 'authorizedReadOnlyAccess', 'professionalReports'],
  },
] as const;
