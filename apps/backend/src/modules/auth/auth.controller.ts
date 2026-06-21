import { Body, Controller, Get, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ConfirmEmailVerificationDto,
  ConfirmPasswordResetDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  RequestEmailVerificationDto,
  RequestPasswordResetDto,
} from './auth.dto';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Post('google') google(@Body() dto: GoogleLoginDto) { return this.auth.googleLogin(dto); }
  @Get('google/mobile/start')
  @Redirect('', 302)
  googleMobileStart() {
    return { url: this.auth.googleMobileStartUrl(), statusCode: 302 };
  }
  @Get('google/mobile/callback')
  @Redirect('', 302)
  async googleMobileCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    return { url: await this.auth.googleMobileCallbackUrl({ code, state, error }), statusCode: 302 };
  }
  @Post('password-reset/request') requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto);
  }
  @Post('password-reset/confirm') confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.auth.confirmPasswordReset(dto);
  }
  @Post('email-verification/request') requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.auth.requestEmailVerification(dto);
  }
  @Post('email-verification/confirm') confirmEmailVerification(@Body() dto: ConfirmEmailVerificationDto) {
    return this.auth.confirmEmailVerification(dto);
  }
  @Get('me') @UseGuards(JwtAuthGuard) me(@CurrentUser() user: AuthenticatedUser) { return user; }
}
