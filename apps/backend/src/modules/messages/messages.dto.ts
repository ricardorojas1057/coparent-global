import { ChatCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(4000) content!: string;
  @IsOptional() @IsEnum(ChatCategory) category?: ChatCategory;
  @IsOptional() @IsString() @MaxLength(100) clientMutationId?: string;
}

export class ReviewMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(4000) content!: string;
  @IsOptional() @IsString() @Matches(/^[a-z]{2}(?:-[A-Z]{2})?$/) locale?: string;
}
