import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) firstName!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) lastName!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
}

export class LoginDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @IsNotEmpty() @MaxLength(128) password!: string;
}

export class RequestPasswordResetDto {
  @IsEmail() @MaxLength(254) email!: string;
}

export class ConfirmPasswordResetDto {
  @IsString() @IsNotEmpty() @MaxLength(128) token!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}

export class GoogleLoginDto {
  @IsString() @IsNotEmpty() @MaxLength(10_000) idToken!: string;
}

export class RequestEmailVerificationDto {
  @IsEmail() @MaxLength(254) email!: string;
}

export class ConfirmEmailVerificationDto {
  @IsString() @IsNotEmpty() @MaxLength(128) token!: string;
}
