import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfirmPasswordResetDto, GoogleLoginDto, LoginDto, RegisterDto, RequestPasswordResetDto } from './auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtPayload } from './auth.types';
import { Role } from '@prisma/client';
import { MailService } from '../../common/mail/mail.service';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

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
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('El email ya está registrado.');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email.toLowerCase(), passwordHash, firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone },
    });
    return this.issueToken(user.id, user.email, user.role, user.authVersion);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Credenciales inválidas.');
    return this.issueToken(user.id, user.email, user.role, user.authVersion);
  }

  async googleLogin(dto: GoogleLoginDto) {
    const payload = await this.verifyGoogleIdToken(dto.idToken);
    if (!payload.sub || !payload.email || !payload.email_verified) {
      throw new UnauthorizedException('No pudimos validar la cuenta de Google.');
    }

    const email = payload.email.toLowerCase();
    const existingByGoogle = await this.prisma.user.findUnique({ where: { googleSubject: payload.sub } });
    if (existingByGoogle) {
      return this.issueToken(existingByGoogle.id, existingByGoogle.email, existingByGoogle.role, existingByGoogle.authVersion);
    }

    const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      const linked = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleSubject: payload.sub },
      });
      return this.issueToken(linked.id, linked.email, linked.role, linked.authVersion);
    }

    const displayName = payload.name?.trim() || email.split('@')[0];
    const [firstName, ...lastNameParts] = displayName.split(/\s+/);
    const user = await this.prisma.user.create({
      data: {
        email,
        googleSubject: payload.sub,
        firstName: firstName || 'Google',
        lastName: lastNameParts.join(' ') || 'User',
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
      },
    });
    return this.issueToken(user.id, user.email, user.role, user.authVersion);
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (user) {
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

  private resetRequestMessage() {
    return 'Si existe una cuenta con ese email, enviaremos un enlace de recuperacion.';
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

  private issueToken(userId: string, email: string, role: Role, authVersion: number) {
    const payload: JwtPayload = { sub: userId, email, role, ver: authVersion };
    return { accessToken: this.jwt.sign(payload), userId, email };
  }
}
