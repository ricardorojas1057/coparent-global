import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterPushTokenDto, RemovePushTokenDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('devices')
  registerDevice(@Body() dto: RegisterPushTokenDto, @CurrentUser() user: AuthenticatedUser) {
    return this.notifications.registerDevice(user.id, dto);
  }

  @Delete('devices')
  removeDevice(@Body() dto: RemovePushTokenDto, @CurrentUser() user: AuthenticatedUser) {
    return this.notifications.removeDevice(user.id, dto.token);
  }
}
