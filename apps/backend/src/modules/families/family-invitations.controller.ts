import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FamiliesService } from './families.service';

@Controller('invitations')
export class FamilyInvitationsController {
  constructor(private readonly families: FamiliesService) {}

  @Get(':token')
  preview(@Param('token') token: string) {
    return this.families.previewInvitation(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Param('token') token: string, @CurrentUser() user: AuthenticatedUser) {
    return this.families.acceptInvitation(token, user.id, user.email);
  }
}
