import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateWhatsAppLinkCodeDto {
  @IsUUID() familyId!: string;
}

export class CreateSharedActionDto {
  @IsUUID() familyId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;

  @IsOptional()
  @IsBoolean()
  hasImage?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20_000_000)
  fileSize?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  fileCount?: number;
}

export class UpdatePendingActionDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MaxLength(4000)
  text!: string;
}
