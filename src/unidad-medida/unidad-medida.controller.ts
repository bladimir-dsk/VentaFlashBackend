import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UnidadMedidaService } from './unidad-medida.service';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto';
import { CreateUnidadConversioneDto } from 'src/unidad-conversiones/dto/create-unidad-conversione.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { TipoUnidadMedida } from 'src/common/enums/TipoUnidadMedida';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth('jwt')
@Auth(Role.SOPORTE)
@Controller('unidad-medida')
export class UnidadMedidaController {
  constructor(private readonly unidadMedidaService: UnidadMedidaService) {}


  @Auth([Role.SOPORTE, Role.EMPLEADO, Role.EMPRESA])
  @Get('filtro/tipos/:id_unidad_medida')
  async findTipoUnidadPorUnidad(@ActiveUser() user: UserActiveInterface, @Param('id_unidad_medida') id_unidad_medida: number) {
    return this.unidadMedidaService.findTipoUnidadPorUnidad(user, id_unidad_medida);
  }
  @Post()
  create(@Body() createUnidadMedidaDto: CreateUnidadMedidaDto, @ActiveUser() user: UserActiveInterface) {
    return this.unidadMedidaService.create(createUnidadMedidaDto, user);
  }

  @Post('relacion')
  createConversion(@Body() createUnidadConversioneDto: CreateUnidadConversioneDto) {
    return this.unidadMedidaService.createConversion(createUnidadConversioneDto);
  }

  @Post('convert')
  async convertValue(@Body() createUnidadConversioneDto: CreateUnidadConversioneDto) {
    return this.unidadMedidaService.convertValue(createUnidadConversioneDto);
  }

  @Auth([Role.SOPORTE, Role.EMPLEADO, Role.EMPRESA])
  @Get()
  findAll(@ActiveUser() user: UserActiveInterface,   @Query('tipo') tipo: TipoUnidadMedida,) {
    return this.unidadMedidaService.findAll(user, tipo);
  }

  @Auth([Role.SOPORTE, Role.EMPLEADO, Role.EMPRESA])
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.unidadMedidaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateUnidadMedidaDto: UpdateUnidadMedidaDto, @ActiveUser() user: UserActiveInterface) {
    return this.unidadMedidaService.update(+id, updateUnidadMedidaDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.unidadMedidaService.remove(+id, user);
  }

  

}
