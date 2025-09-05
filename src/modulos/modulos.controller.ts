import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ModulosService } from './modulos.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ApiBearerAuth } from '@nestjs/swagger';



@ApiBearerAuth('jwt')
@Auth(Role.SOPORTE)
@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Post()
  create(@Body() createModuloDto: CreateModuloDto, @ActiveUser() user: UserActiveInterface) {
    return this.modulosService.create(createModuloDto, user);
  }


  @Auth([Role.EMPRESA, Role.EMPLEADO, Role.SOPORTE])
  @Get()
  findAll(@ActiveUser() user: UserActiveInterface) {
    return this.modulosService.findAll(user);
  }

  @Auth([Role.EMPRESA, Role.EMPLEADO, Role.SOPORTE])
  @Get(':id')
  findOne(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.modulosService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateModuloDto: UpdateModuloDto, @ActiveUser() user: UserActiveInterface) {
    return this.modulosService.update(+id, updateModuloDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number,@ActiveUser() user: UserActiveInterface) {
    return this.modulosService.remove(+id, user);
  }
}
