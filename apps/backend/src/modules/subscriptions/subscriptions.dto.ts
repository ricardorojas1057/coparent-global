import { SubscriptionPlan } from '@prisma/client';
import { IsEnum, IsString, Length } from 'class-validator';

export class RequestPlanChangeDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;
}

export class VerifyGooglePlayPurchaseDto {
  @IsString()
  @Length(3, 200)
  productId!: string;

  @IsString()
  @Length(10, 4096)
  purchaseToken!: string;
}
