import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlanVigenciaService } from './plan-vigencia.service';
import { CreatePlanVigenciaDto } from './dto/create-plan-vigencia.dto';
import { UpdatePlanVigenciaDto } from './dto/update-plan-vigencia.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth('jwt')
@Controller('plan-vigencia')
export class PlanVigenciaController {
  constructor(private readonly planVigenciaService: PlanVigenciaService) {}

  @Auth(Role.SOPORTE)
  @Post()
  create(@Body() createPlanVigenciaDto: CreatePlanVigenciaDto, @ActiveUser() user: UserActiveInterface) {
    return this.planVigenciaService.create(createPlanVigenciaDto, user);
  }

  @Get()
  findAll() {
    return this.planVigenciaService.findAll();
  }

  @Get('activos')
  filtrarEstadoActivo() {
    return this.planVigenciaService.filtrarEstadoActivo();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.planVigenciaService.findOne(+id);
  }


  @Auth(Role.SOPORTE)
  @Patch(':id')
  update(@Param('id') id: number, @Body() updatePlanVigenciaDto: UpdatePlanVigenciaDto, @ActiveUser() user: UserActiveInterface) {
    return this.planVigenciaService.update(+id, updatePlanVigenciaDto, user);
  }

  @Auth(Role.SOPORTE)
  @Delete(':id')
  remove(@Param('id') id: number, @ActiveUser() user: UserActiveInterface) {
    return this.planVigenciaService.remove(+id, user);
  }
}
