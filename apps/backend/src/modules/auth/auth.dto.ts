import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsOptional() @IsString() phone?: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() password!: string;
}

export class RequestPasswordResetDto {
  @IsEmail() email!: string;
}

export class ConfirmPasswordResetDto {
  @IsString() @IsNotEmpty() token!: string;
  @IsString() @MinLength(8) password!: string;
}

export class GoogleLoginDto {
  @IsString() @IsNotEmpty() idToken!: string;
}
