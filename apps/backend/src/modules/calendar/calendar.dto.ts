import { CalendarEventStatus, CalendarEventType, RequestStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCalendarEventDto {
  @IsUUID() childId!: string;
  @IsUUID() currentParentId!: string;
  @IsString() @MaxLength(120) title!: string;
  @IsEnum(CalendarEventType) type!: CalendarEventType;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
}

export class UpdateCalendarEventDto {
  @IsOptional() @IsUUID() currentParentId?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsEnum(CalendarEventType) type?: CalendarEventType;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsEnum(CalendarEventStatus) status?: CalendarEventStatus;
}

export class CreateCalendarChangeRequestDto {
  @IsDateString() newStartDate!: string;
  @IsDateString() newEndDate!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class ResolveCalendarChangeRequestDto {
  @IsEnum(RequestStatus) status!: RequestStatus;
}
