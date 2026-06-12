import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions/google-play')
export class GooglePlayNotificationsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Post('notifications')
  @HttpCode(204)
  async receiveNotification(@Headers('authorization') authorization: string | undefined, @Body() body: unknown) {
    await this.subscriptions.syncGooglePlayNotification(authorization, body);
  }
}
