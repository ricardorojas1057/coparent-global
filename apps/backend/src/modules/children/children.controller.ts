import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChildrenService } from './children.service';
import { CreateChildDto, UpdateChildDto } from './children.dto';

@Controller('children')
@UseGuards(JwtAuthGuard)
export class ChildrenController {
  constructor(private readonly children: ChildrenService) {}
  @Post() create(@Body() dto: CreateChildDto, @CurrentUser() user: AuthenticatedUser) {
    return this.children.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') childId: string,
    @Body() dto: UpdateChildDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.children.update(childId, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') childId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.children.remove(childId, user.id);
  }
}
