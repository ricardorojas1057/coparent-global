import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMessageDto, ReviewMessageDto } from './messages.dto';
import { MessagesService } from './messages.service';

@Controller('families/:familyId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  findFamilyMessages(@Param('familyId') familyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.messages.findFamilyMessages(familyId, user.id);
  }

  @Post()
  create(
    @Param('familyId') familyId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messages.create(familyId, dto, user.id);
  }

  @Post('review')
  review(
    @Param('familyId') familyId: string,
    @Body() dto: ReviewMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messages.review(familyId, dto, user.id);
  }

  @Post(':messageId/view')
  markViewed(
    @Param('familyId') familyId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messages.markViewed(familyId, messageId, user.id);
  }
}
