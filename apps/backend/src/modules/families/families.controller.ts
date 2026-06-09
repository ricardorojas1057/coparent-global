import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FamiliesService } from './families.service';
import { AddFamilyMemberDto, CreateFamilyDto, CreateFamilyInvitationDto, UpdateFamilySettingsDto } from './families.dto';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(private readonly families: FamiliesService) {}

  @Get() findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.families.findMine(user.id);
  }

  @Post() create(@Body() dto: CreateFamilyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.families.create(dto, user.id);
  }

  @Post(':id/members')
  addMember(
    @Param('id') familyId: string,
    @Body() dto: AddFamilyMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.families.addMember(familyId, dto, user.id);
  }

  @Get(':id/invitations')
  invitations(@Param('id') familyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.families.listInvitations(familyId, user.id);
  }

  @Post(':id/invitations')
  createInvitation(
    @Param('id') familyId: string,
    @Body() dto: CreateFamilyInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.families.createInvitation(familyId, dto, user.id);
  }

  @Delete(':id/invitations/:invitationId')
  revokeInvitation(
    @Param('id') familyId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.families.revokeInvitation(familyId, invitationId, user.id);
  }

  @Patch(':id/settings')
  updateSettings(
    @Param('id') familyId: string,
    @Body() dto: UpdateFamilySettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.families.updateSettings(familyId, dto, user.id);
  }
}
