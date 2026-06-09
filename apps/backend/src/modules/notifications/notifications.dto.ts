import { IsIn, IsString, Matches } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @Matches(/^ExponentPushToken\[[^\]]+\]$/)
  token!: string;

  @IsString()
  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';
}

export class RemovePushTokenDto {
  @IsString()
  @Matches(/^ExponentPushToken\[[^\]]+\]$/)
  token!: string;
}
