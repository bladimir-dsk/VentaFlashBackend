import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EmpleadoService } from './empleado.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('jwt')
@Auth([Role.EMPLEADO, Role.EMPRESA])
@Controller('empleado')
export class EmpleadoController {
  constructor(private readonly empleadoService: EmpleadoService) {}

  @Post()
  create(@Body() createEmpleadoDto: CreateEmpleadoDto, @ActiveUser() user: UserActiveInterface) {
    return this.empleadoService.create(createEmpleadoDto, user);
  }

  
  @Get()
  findAll( @ActiveUser() user: UserActiveInterface) {
    return this.empleadoService.findAll(user);
  }

  @Get('cajas-disponibles')
  findCajasDisponibles( @ActiveUser() user: UserActiveInterface) {
    return this.empleadoService.findCajasDisponibles(user);
  }


  @Get(':id')
  findOne(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.empleadoService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateEmpleadoDto: UpdateEmpleadoDto, @ActiveUser() user: UserActiveInterface) {
    return this.empleadoService.update(+id, updateEmpleadoDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.empleadoService.remove(+id, user);
  }

  @Get('filtro/aplica')
  async filtroEmpleadoAplica(@ActiveUser() user: UserActiveInterface){
    return this.empleadoService.findEmpleadoAplicaUsuario(user);
  }

  @Get('filtro/no-aplica')
  async filtroEmpleadoNoAplica(@ActiveUser() user: UserActiveInterface){
    return this.empleadoService.findEmpleadoNoAplicaUsuario(user);
  }


  @Auth(Role.SOPORTE)
  @Get('filtro/empresa/:id')
  async filtroEmpleadoPorEmpresa(@Param('id') id_empresa: number, @ActiveUser() user: UserActiveInterface){
    return this.empleadoService.findEmpleadoPorEmpresa(id_empresa, user);
  }

  @Auth(Role.SOPORTE)
  @Get('filtro/empresa/:id/aplica')
  async filtroEmpleadoPorEmpresaAplica(@Param('id') id_empresa: number, @ActiveUser() user: UserActiveInterface){
    return this.empleadoService.findEmpleadoPorEmpresaAplicaEnUsuario(id_empresa, user);
  }

  @Auth(Role.SOPORTE)
  @Get('filtro/empresa/:id/no-aplica')
  async filtroEmpleadoPorEmpresaNoAplica(@Param('id') id_empresa: number, @ActiveUser() user: UserActiveInterface){
    return this.empleadoService.findEmpleadoPorEmpresaNoAplicaEnUsuario(id_empresa, user);
  }

  @Auth(Role.SOPORTE)
  @Get('soporte/empresa/:id/usuario')
  async filtroEmpleadoPorEmpresaUsuario(@Param('id') id_empresa: number, @ActiveUser() user: UserActiveInterface){
    return this.empleadoService.filterSoporteEmployeesPorEmpresa(id_empresa, user);
  }

}
