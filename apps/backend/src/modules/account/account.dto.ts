import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdatePrivacySettingsDto {
  @IsOptional() @IsString() @Matches(/^[a-z]{2}(?:-[A-Z]{2})?$/) preferredLocale?: string;
  @IsOptional() @IsBoolean() allowProductAnalytics?: boolean;
  @IsOptional() @IsBoolean() allowAiProcessing?: boolean;
}

export class ConfirmAccountDeletionDto {
  @IsBoolean() confirm!: boolean;
}
