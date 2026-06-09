import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateCalendarChangeRequestDto,
  CreateCalendarEventDto,
  ResolveCalendarChangeRequestDto,
  UpdateCalendarEventDto,
} from './calendar.dto';
import { CalendarService } from './calendar.service';

@Controller('calendar-events')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.calendar.findMine(user.id);
  }

  @Get('change-requests')
  findChangeRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.calendar.findChangeRequests(user.id);
  }

  @Post()
  create(@Body() dto: CreateCalendarEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.calendar.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') eventId: string, @Body() dto: UpdateCalendarEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.calendar.update(eventId, dto, user.id);
  }

  @Delete(':id')
  cancel(@Param('id') eventId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.calendar.cancel(eventId, user.id);
  }

  @Post(':id/change-requests')
  createChangeRequest(
    @Param('id') eventId: string,
    @Body() dto: CreateCalendarChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calendar.createChangeRequest(eventId, dto, user.id);
  }

  @Patch('change-requests/:id/resolve')
  resolveChangeRequest(
    @Param('id') requestId: string,
    @Body() dto: ResolveCalendarChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calendar.resolveChangeRequest(requestId, dto, user.id);
  }
}
