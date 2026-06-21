import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FamiliesService } from './families.service';
import { RespondFamilyInvitationDto } from './families.dto';

@Controller('invitations')
export class FamilyInvitationsController {
  constructor(private readonly families: FamiliesService) {}

  @Get(':token')
  preview(@Param('token') token: string) {
    return this.families.previewInvitation(token);
  }

  @Post(':token/respond')
  respond(@Param('token') token: string, @Body() dto: RespondFamilyInvitationDto) {
    return this.families.respondToInvitation(token, dto.response);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Param('token') token: string, @CurrentUser() user: AuthenticatedUser) {
    return this.families.acceptInvitation(token, user.id, user.email);
  }
}
