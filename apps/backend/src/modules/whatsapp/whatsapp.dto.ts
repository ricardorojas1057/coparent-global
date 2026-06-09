import { IsUUID } from 'class-validator';

export class CreateWhatsAppLinkCodeDto {
  @IsUUID() familyId!: string;
}
