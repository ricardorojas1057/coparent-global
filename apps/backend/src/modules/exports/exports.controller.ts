import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BasicFamilyExportQueryDto } from './exports.dto';
import { ExportsService } from './exports.service';

@Controller('families/:familyId/exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('basic')
  basicFamilyExport(
    @Param('familyId') familyId: string,
    @Query() query: BasicFamilyExportQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.exportsService.basicFamilyHtml(familyId, user.id, query.language ?? 'es');
  }
}

