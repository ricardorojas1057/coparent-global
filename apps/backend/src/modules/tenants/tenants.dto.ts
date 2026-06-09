import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TenantType } from '@prisma/client';

export class CreateTenantDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEnum(TenantType) type!: TenantType;
}
