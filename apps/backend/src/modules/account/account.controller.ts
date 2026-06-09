import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountService } from './account.service';
import { UpdatePrivacySettingsDto } from './account.dto';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('privacy')
  getPrivacy(@CurrentUser() user: AuthenticatedUser) {
    return this.account.getPrivacy(user.id);
  }

  @Patch('privacy')
  updatePrivacy(@Body() dto: UpdatePrivacySettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.account.updatePrivacy(user.id, dto);
  }

  @Post('deletion-request')
  requestDeletion(@CurrentUser() user: AuthenticatedUser) {
    return this.account.requestDeletion(user.id);
  }

  @Delete('deletion-request')
  cancelDeletion(@CurrentUser() user: AuthenticatedUser) {
    return this.account.cancelDeletion(user.id);
  }
}
