import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UnidadConversionesService } from './unidad-conversiones.service';
import { CreateUnidadConversioneDto } from './dto/create-unidad-conversione.dto';
import { UpdateUnidadConversioneDto } from './dto/update-unidad-conversione.dto';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth('jwt')
@Controller('unidad-conversiones')
export class UnidadConversionesController {
  constructor(private readonly unidadConversionesService: UnidadConversionesService) {}

  @Post()
  create(@Body() createUnidadConversioneDto: CreateUnidadConversioneDto) {
    return this.unidadConversionesService.create(createUnidadConversioneDto);
  }

  @Get()
  findAll() {
    return this.unidadConversionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unidadConversionesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUnidadConversioneDto: UpdateUnidadConversioneDto) {
    return this.unidadConversionesService.update(+id, updateUnidadConversioneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unidadConversionesService.remove(+id);
  }
}
