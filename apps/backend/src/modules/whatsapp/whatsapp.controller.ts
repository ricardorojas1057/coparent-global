import { Body, Controller, Get, Param, Post, Query, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWhatsAppLinkCodeDto } from './whatsapp.dto';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get('webhook')
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    return this.whatsapp.verifyWebhook(mode, token, challenge);
  }

  @Post('webhook')
  webhook(@Req() request: RawBodyRequest<Request>, @Body() body: unknown) {
    return this.whatsapp.processWebhook(request, body);
  }

  @Post('link-code')
  @UseGuards(JwtAuthGuard)
  createLinkCode(@Body() dto: CreateWhatsAppLinkCodeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.whatsapp.createLinkCode(dto.familyId, user.id);
  }

  @Get('links')
  @UseGuards(JwtAuthGuard)
  links(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsapp.listLinks(user.id);
  }

  @Get('actions')
  @UseGuards(JwtAuthGuard)
  actions(@CurrentUser() user: AuthenticatedUser) {
    return this.whatsapp.listActions(user.id);
  }

  @Post('actions/:id/confirm')
  @UseGuards(JwtAuthGuard)
  confirm(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.whatsapp.confirmAction(id, user.id);
  }

  @Post('actions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.whatsapp.cancelAction(id, user.id);
  }
}
