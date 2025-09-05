import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedoreDto } from './dto/create-proveedore.dto';
import { UpdateProveedoreDto } from './dto/update-proveedore.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth('jwt')
@Auth([Role.EMPRESA, Role.EMPLEADO])

@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  create(@Body() createProveedoreDto: CreateProveedoreDto, @ActiveUser() user: UserActiveInterface) {
    return this.proveedoresService.create(createProveedoreDto, user);
  }

  @Get()
  findAll(@ActiveUser() user: UserActiveInterface) {
    return this.proveedoresService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.proveedoresService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateProveedoreDto: UpdateProveedoreDto, @ActiveUser() user: UserActiveInterface) {
    return this.proveedoresService.update(+id, updateProveedoreDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.proveedoresService.remove(+id, user);
  }


  @Auth(Role.SOPORTE)
  @Get('filtro/empresa/:id')
  async filtroProveedoresPorEmpresa(@Param('id') id_empresa: number, @ActiveUser() user: UserActiveInterface){
    return this.proveedoresService.findProveedoresPorEmpresa(id_empresa, user);
  }
}
