import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestPlanChangeDto, VerifyGooglePlayPurchaseDto } from './subscriptions.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('families/:familyId/subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get()
  getFamilySubscription(@Param('familyId') familyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.subscriptions.getFamilySubscription(familyId, user.id);
  }

  @Patch('request')
  requestPlanChange(
    @Param('familyId') familyId: string,
    @Body() dto: RequestPlanChangeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptions.requestPlanChange(familyId, dto.plan, user.id);
  }

  @Post('google-play/verify')
  verifyGooglePlayPurchase(
    @Param('familyId') familyId: string,
    @Body() dto: VerifyGooglePlayPurchaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptions.verifyGooglePlayPurchase(familyId, dto, user.id);
  }
}
