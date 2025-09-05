import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PerfilService } from './perfil.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth('jwt')
@Auth([Role.EMPLEADO, Role.EMPRESA])
@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Post()
  create(@Body() createPerfilDto: CreatePerfilDto, @ActiveUser() user: UserActiveInterface) {
    return this.perfilService.create(createPerfilDto, user);
  }


  @Get()
  findAll(@ActiveUser() user: UserActiveInterface) {
    return this.perfilService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.perfilService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updatePerfilDto: UpdatePerfilDto, @ActiveUser() user: UserActiveInterface) {
    return this.perfilService.update(+id, updatePerfilDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.perfilService.remove(+id, user);
  }


  @Auth(Role.SOPORTE)
  @Get('filtro/empresa/:id')
  async filtroPerfilPorEmpresa(@Param('id') id_empresa: number, @ActiveUser() user: UserActiveInterface) {
    return this.perfilService.findAllPerfilEmpresa(id_empresa, user);
  }
}
