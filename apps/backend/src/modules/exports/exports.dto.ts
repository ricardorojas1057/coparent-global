import { IsIn, IsOptional } from 'class-validator';

export class BasicFamilyExportQueryDto {
  @IsOptional()
  @IsIn(['es', 'en'])
  language?: 'es' | 'en';
}

