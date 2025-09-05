import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlanesService } from './planes.service';
import { CreatePlaneDto } from './dto/create-plane.dto';
import { UpdatePlaneDto } from './dto/update-plane.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth('jwt')
@Controller('planes')
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  @Auth(Role.SOPORTE)
  @Post()
  create(@Body() createPlaneDto: CreatePlaneDto, @ActiveUser() user: UserActiveInterface) {
    return this.planesService.create(createPlaneDto, user);
  }

  @Get()
  findAll() {
    return this.planesService.findAll();
  }

  @Get('active')
  findAllActive() {
    return this.planesService.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.planesService.findOne(+id);
  }

  @Auth(Role.SOPORTE)
  @Patch(':id')
  update(@Param('id') id: number, @Body() updatePlaneDto: UpdatePlaneDto, @ActiveUser() user: UserActiveInterface) {
    return this.planesService.update(+id, updatePlaneDto, user);
  }

  @Auth(Role.SOPORTE)
  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.planesService.remove(+id, user);
  }
}
