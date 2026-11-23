import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { AuthorGuard } from './author.guard';
import { CommonMastersService, type MasterType } from './common-masters.service';

@Controller('admin/masters')
@UseGuards(AuthorGuard)
export class CommonMastersController {
  constructor(private readonly masters: CommonMastersService) {}

  @Get(':type')
  async list(@Param('type') type: MasterType) { return this.masters.list(type); }

  @Post(':type')
  async create(@Param('type') type: MasterType, @Body() data: unknown) {
    return this.masters.create(type,data);
  }

  @Patch(':type/:id')
  async edit(@Param('type') type: MasterType, @Param('id') id: string, @Body() data: unknown) {
    return this.masters.edit(type,id,data);
  }

  @Delete(':type/:id')
  async remove(@Param('type') type: MasterType, @Param('id') id: string, @Body() data: {expectedRevision?: unknown}) {
    return this.masters.remove(type,id,data?.expectedRevision);
  }
}
