import { FamilyInvitationGuestResponse, FamilyRole, RelationshipMode } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

export class CreateFamilyDto {
  @IsUUID() @IsNotEmpty() tenantId!: string;
}

export class AddFamilyMemberDto {
  @IsEmail() email!: string;
}

export class CreateFamilyInvitationDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(FamilyRole) role?: FamilyRole;
}

export class RespondFamilyInvitationDto {
  @IsEnum(FamilyInvitationGuestResponse) response!: FamilyInvitationGuestResponse;
}

export class UpdateFamilySettingsDto {
  @IsOptional() @IsEnum(RelationshipMode) relationshipMode?: RelationshipMode;
  @IsOptional() @IsString() @Matches(/^[a-z]{2}(?:-[A-Z]{2})?$/) locale?: string;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  @IsOptional() @IsString() @MaxLength(80) timezone?: string;
  @IsOptional() @IsString() @Length(2, 2) countryCode?: string;
  @IsOptional() @IsString() @MaxLength(500) jurisdictionNotice?: string;
  @IsOptional() @IsBoolean() enableAiModeration?: boolean;
  @IsOptional() @IsBoolean() enablePushNotifications?: boolean;
}
