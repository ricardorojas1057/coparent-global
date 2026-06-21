import { ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { MailService } from '../../common/mail/mail.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ConfirmEmailVerificationDto,
  ConfirmPasswordResetDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  RequestEmailVerificationDto,
  RequestPasswordResetDto,
} from './auth.dto';
import { JwtPayload } from './auth.types';

type GoogleMobileCallbackQuery = {
  code?: string;
  state?: string;
  error?: string;
};

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    if (!this.mail.isConfigured()) {
      throw new ServiceUnavailableException(
        'El registro por email esta temporalmente pausado. Podes continuar con Google.',
      );
    }
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('El email ya esta registrado.');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });
    const delivered = await this.sendEmailVerification(user.id, user.email);
    return {
      requiresEmailVerification: true,
      email: user.email,
      delivered,
      message: 'Revisa tu email para verificar la cuenta antes de ingresar.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || user.deletedAt || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Primero verifica tu email. Podes solicitar un nuevo enlace desde la app.');
    }
    return this.issueToken(user.id, user.email, user.role, user.authVersion);
  }

  async googleLogin(dto: GoogleLoginDto) {
    const payload = await this.verifyGoogleIdToken(dto.idToken);
    return this.completeGoogleLogin(payload);
  }

  googleMobileStartUrl() {
    const clientId = this.config.get<string>('GOOGLE_WEB_CLIENT_ID');
    if (!clientId || !this.googleWebClientSecret()) {
      return this.googleMobileErrorUrl('Google por navegador no esta configurado.');
    }

    const state = this.jwt.sign(
      { typ: 'google-mobile-oauth' },
      { expiresIn: '10m' },
    );
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.googleMobileRedirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
      access_type: 'online',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async googleMobileCallbackUrl(query: GoogleMobileCallbackQuery) {
    try {
      if (query.error) return this.googleMobileErrorUrl('Google cancelo el inicio de sesion.');
      if (!query.code || !query.state) return this.googleMobileErrorUrl('Google no devolvio los datos necesarios.');
      const state = this.jwt.verify<{ typ?: string }>(query.state);
      if (state.typ !== 'google-mobile-oauth') {
        return this.googleMobileErrorUrl('La respuesta de Google no es valida.');
      }

      const idToken = await this.exchangeGoogleCodeForIdToken(query.code);
      const payload = await this.verifyGoogleIdToken(idToken);
      const auth = await this.completeGoogleLogin(payload);
      return this.googleMobileSuccessUrl(auth.accessToken);
    } catch {
      return this.googleMobileErrorUrl('No pudimos iniciar sesion con Google.');
    }
  }

  private async completeGoogleLogin(payload: TokenPayload) {
    if (!payload.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('No pudimos validar la cuenta de Google.');
    }

    const email = payload.email.toLowerCase();
    const existingByGoogle = await this.prisma.user.findUnique({ where: { googleSubject: payload.sub } });
    if (existingByGoogle) {
      if (existingByGoogle.deletedAt) throw new UnauthorizedException('La cuenta no esta disponible.');
      return this.issueToken(existingByGoogle.id, existingByGoogle.email, existingByGoogle.role, existingByGoogle.authVersion);
    }

    const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      if (existingByEmail.deletedAt) throw new UnauthorizedException('La cuenta no esta disponible.');
      const linked = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleSubject: payload.sub, emailVerifiedAt: existingByEmail.emailVerifiedAt ?? new Date() },
      });
      return this.issueToken(linked.id, linked.email, linked.role, linked.authVersion);
    }

    const displayName = payload.name?.trim() || email.split('@')[0];
    const [firstName, ...lastNameParts] = displayName.split(/\s+/);
    const user = await this.prisma.user.create({
      data: {
        email,
        googleSubject: payload.sub,
        emailVerifiedAt: new Date(),
        firstName: firstName || 'Google',
        lastName: lastNameParts.join(' ') || 'User',
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
      },
    });
    return this.issueToken(user.id, user.email, user.role, user.authVersion);
  }

  private async exchangeGoogleCodeForIdToken(code: string) {
    const clientId = this.config.get<string>('GOOGLE_WEB_CLIENT_ID');
    const clientSecret = this.googleWebClientSecret();
    if (!clientId || !clientSecret) throw new ServiceUnavailableException('Google por navegador no esta configurado.');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.googleMobileRedirectUri(),
        grant_type: 'authorization_code',
      }),
    });
    const body = await response.json() as { id_token?: string };
    if (!response.ok || !body.id_token) {
      throw new UnauthorizedException('Google no devolvio un token de identidad.');
    }
    return body.id_token;
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (user && !user.deletedAt) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(token);
      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
      });
      await this.mail.sendPasswordReset(user.email, token);

      if (this.config.get<string>('NODE_ENV') !== 'production') {
        return { message: this.resetRequestMessage(), developmentToken: token };
      }
    }
    return { message: this.resetRequestMessage() };
  }

  async confirmPasswordReset(dto: ConfirmPasswordResetDto) {
    const tokenHash = this.hashToken(dto.token);
    const reset = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
      throw new UnauthorizedException('El enlace de recuperacion no es valido o ya vencio.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash, authVersion: { increment: 1 } },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: reset.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'La contrasena fue actualizada. Ya podes iniciar sesion.' };
  }

  async requestEmailVerification(dto: RequestEmailVerificationDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (user && !user.deletedAt && !user.emailVerifiedAt) {
      await this.sendEmailVerification(user.id, user.email);
    }
    return { message: this.verificationRequestMessage() };
  }

  async confirmEmailVerification(dto: ConfirmEmailVerificationDto) {
    const tokenHash = this.hashToken(dto.token);
    const verification = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!verification || verification.usedAt || verification.expiresAt <= new Date()) {
      throw new UnauthorizedException('El enlace de verificacion no es valido o ya vencio.');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.updateMany({
        where: { userId: verification.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Email verificado. Ya podes ingresar a Coparent Global.' };
  }

  private resetRequestMessage() {
    return 'Si existe una cuenta con ese email, enviaremos un enlace de recuperacion.';
  }

  private verificationRequestMessage() {
    return 'Si la cuenta necesita verificacion, enviaremos un nuevo enlace.';
  }

  private async sendEmailVerification(userId: string, email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 *1000),
      },
    });
    const result = await this.mail.sendEmailVerification(email, token);
    return result.delivered;
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
    const audiences = this.googleAudiences();
    if (!audiences.length) throw new UnauthorizedException('Google Sign-In no esta configurado.');
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken, audience: audiences });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('No pudimos validar la cuenta de Google.');
      return payload;
    } catch {
      throw new UnauthorizedException('No pudimos validar la cuenta de Google.');
    }
  }

  private googleAudiences() {
    const configured = [
      this.config.get<string>('GOOGLE_WEB_CLIENT_ID'),
      this.config.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_IDS'),
    ];
    return configured
      .flatMap((value) => value?.split(',') ?? [])
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private googleWebClientSecret() {
    return this.config.get<string>('GOOGLE_WEB_CLIENT_SECRET') ?? this.config.get<string>('GOOGLE_CLIENT_SECRET');
  }

  private googleMobileRedirectUri() {
    return this.config.get<string>('GOOGLE_MOBILE_REDIRECT_URI') ??
      `${this.publicApiUrl()}/auth/google/mobile/callback`;
  }

  private publicApiUrl() {
    return (this.config.get<string>('PUBLIC_API_URL') ?? 'https://coparent-argentina-api.vercel.app').replace(/\/$/, '');
  }

  private googleMobileDeepLinkBase() {
    return this.config.get<string>('GOOGLE_MOBILE_DEEP_LINK') ?? 'coparentglobal://auth/google';
  }

  private googleMobileSuccessUrl(accessToken: string) {
    const params = new URLSearchParams({ accessToken });
    return `${this.googleMobileDeepLinkBase()}?${params.toString()}`;
  }

  private googleMobileErrorUrl(message: string) {
    const params = new URLSearchParams({ error: message });
    return `${this.googleMobileDeepLinkBase()}?${params.toString()}`;
  }

  private issueToken(userId: string, email: string, role: Role, authVersion: number) {
    const payload: JwtPayload = { sub: userId, email, role, ver: authVersion };
    return { accessToken: this.jwt.sign(payload), userId, email };
  }
}
