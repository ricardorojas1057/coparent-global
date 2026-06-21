import { ExpenseCategory } from '@prisma/client';
import { ExpenseStatus } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export enum ExpenseSplitMode {
  SHARED = 'SHARED',
  SINGLE_PAYER = 'SINGLE_PAYER',
}

export class CreateExpenseDto {
  @IsUUID() familyId!: string;
  @IsUUID() paidById!: string;
  @IsString() @IsNotEmpty() description!: string;
  @IsEnum(ExpenseCategory) category!: ExpenseCategory;
  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() amount!: number;
  @IsOptional() @IsEnum(ExpenseSplitMode) splitMode?: ExpenseSplitMode;
  @IsOptional() @IsString() @MaxLength(500) receiptReference?: string;
  @IsOptional() @IsString() @MaxLength(100) receiptMimeType?: string;
  @IsOptional() @IsInt() @Min(1) @Max(20_000_000) receiptFileSize?: number;
}

export class UpdateExpenseAllocationStatusDto {
  @IsEnum(ExpenseStatus) status!: ExpenseStatus;
}

export class AttachExpenseReceiptDto {
  @IsString() @IsNotEmpty() @MaxLength(500) receiptReference!: string;
  @IsOptional() @IsString() @MaxLength(100) receiptMimeType?: string;
  @IsOptional() @IsInt() @Min(1) @Max(20_000_000) receiptFileSize?: number;
}

export class UploadExpenseReceiptDto {
  @IsString() @IsNotEmpty() @MaxLength(2_800_000) dataBase64!: string;
  @IsString() @IsIn(['image/jpeg', 'image/png', 'application/pdf']) mimeType!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) fileName!: string;
}
