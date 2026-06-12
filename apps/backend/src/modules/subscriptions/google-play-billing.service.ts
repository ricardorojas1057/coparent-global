import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';

const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

export type GooglePlaySubscriptionPurchase = {
  acknowledgementState?: string;
  latestOrderId?: string;
  subscriptionState?: string;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
    autoRenewingPlan?: { autoRenewEnabled?: boolean };
    offerDetails?: { basePlanId?: string };
  }>;
};

export type GooglePlayNotification = {
  packageName?: string;
  testNotification?: { version?: string };
  subscriptionNotification?: {
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
};

@Injectable()
export class GooglePlayBillingService {
  private readonly oauthClient = new OAuth2Client();

  isConfigured() {
    return Boolean(
      process.env.GOOGLE_PLAY_BILLING_ENABLED === 'true' &&
        process.env.GOOGLE_PLAY_PACKAGE_NAME &&
        process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
    );
  }

  async getSubscription(purchaseToken: string): Promise<GooglePlaySubscriptionPurchase> {
    const packageName = this.packageName();
    return this.googleRequest<GooglePlaySubscriptionPurchase>(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    );
  }

  async acknowledgeSubscription(productId: string, purchaseToken: string, externalAccountId?: string) {
    const packageName = this.packageName();
    await this.googleRequest(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
      {
        method: 'POST',
        body: JSON.stringify(externalAccountId ? { externalAccountId } : {}),
      },
    );
  }

  async verifyPubSubAuthorization(authorization?: string) {
    const audience = process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE;
    const expectedEmail = process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL;
    const idToken = authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!audience || !expectedEmail || !idToken) {
      throw new UnauthorizedException('Notificacion de Google Play no autorizada.');
    }

    const ticket = await this.oauthClient.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (payload?.email !== expectedEmail || payload.email_verified !== true) {
      throw new UnauthorizedException('Identidad de Google Play no autorizada.');
    }
  }

  decodeNotification(body: unknown): GooglePlayNotification {
    const data =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message?: { data?: unknown } }).message?.data
        : undefined;
    if (typeof data !== 'string') {
      throw new BadGatewayException('Notificacion de Google Play invalida.');
    }

    try {
      return JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as GooglePlayNotification;
    } catch {
      throw new BadGatewayException('No se pudo leer la notificacion de Google Play.');
    }
  }

  private packageName() {
    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
    if (!packageName) throw new ServiceUnavailableException('Google Play Billing no esta configurado.');
    return packageName;
  }

  private async googleRequest<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
    const rawCredentials = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    if (!rawCredentials) throw new ServiceUnavailableException('Google Play Billing no esta configurado.');

    let credentials: object;
    try {
      credentials = JSON.parse(rawCredentials) as object;
    } catch {
      throw new ServiceUnavailableException('Las credenciales de Google Play no son validas.');
    }

    const auth = new GoogleAuth({ credentials, scopes: [ANDROID_PUBLISHER_SCOPE] });
    const client = await auth.getClient();
    const headers = await client.getRequestHeaders();
    const response = await fetch(url, {
      ...init,
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new BadGatewayException(`Google Play rechazo la verificacion (${response.status}).`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}
