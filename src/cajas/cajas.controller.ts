import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CajasService } from './cajas.service';
import { CreateCajaDto } from './dto/create-caja.dto';
import { UpdateCajaDto } from './dto/update-caja.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('jwt')
@Auth([Role.EMPLEADO, Role.EMPRESA])
@Controller('cajas')
export class CajasController {
  constructor(private readonly cajasService: CajasService) {}

  @Post()
  create(@Body() createCajaDto: CreateCajaDto, @ActiveUser() user: UserActiveInterface) {
    return this.cajasService.create(createCajaDto, user);
  }

  @Get()
  findAll(@ActiveUser() user: UserActiveInterface) {
    return this.cajasService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: number,@ActiveUser() user: UserActiveInterface) {
    return this.cajasService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: number,@ActiveUser() user: UserActiveInterface, @Body() updateCajaDto: UpdateCajaDto) {
    return this.cajasService.update(+id, updateCajaDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: number,@ActiveUser() user: UserActiveInterface) {
    return this.cajasService.remove(+id, user);
  }
}
