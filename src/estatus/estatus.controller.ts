import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EstatusService } from './estatus.service';
import { CreateEstatusDto } from './dto/create-estatus.dto';
import { UpdateEstatusDto } from './dto/update-estatus.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth('jwt')
@Controller('estatus')
export class EstatusController {
  constructor(private readonly estatusService: EstatusService) {}


  @Auth(Role.SOPORTE)
  @Post()
  create(@Body() createEstatusDto: CreateEstatusDto, @ActiveUser() user: UserActiveInterface) {
    return this.estatusService.create(createEstatusDto,user);
  }

  @Get()
  findAll() {
    return this.estatusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.estatusService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateEstatusDto: UpdateEstatusDto) {
    return this.estatusService.update(+id, updateEstatusDto);
  }

  @Auth(Role.SOPORTE)
  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.estatusService.remove(+id, user);
  }

  @Get('filtro/tipo/:tp_estatus')
  async filtroEstatusPorTipo(@Param('tp_estatus') tp_estatus: string) {
    return this.estatusService.findEstatusPorTipo(tp_estatus);
  }
}
