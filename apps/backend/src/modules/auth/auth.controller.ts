import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfirmPasswordResetDto, GoogleLoginDto, LoginDto, RegisterDto, RequestPasswordResetDto } from './auth.dto';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Post('google') google(@Body() dto: GoogleLoginDto) { return this.auth.googleLogin(dto); }
  @Post('password-reset/request') requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto);
  }
  @Post('password-reset/confirm') confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.auth.confirmPasswordReset(dto);
  }
  @Get('me') @UseGuards(JwtAuthGuard) me(@CurrentUser() user: AuthenticatedUser) { return user; }
}
