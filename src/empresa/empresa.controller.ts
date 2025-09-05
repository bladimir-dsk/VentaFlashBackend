import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RenovacionPagoDto } from 'src/pagos/dto/create-renovacion.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('jwt')
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
create(@Body() createEmpresaDto: { data: CreateEmpresaDto; userId: number }) {
  const { data, userId } = createEmpresaDto;
  return this.empresaService.create(data, userId); // Pasar ambos argumentos
}
  @Auth([Role.EMPRESA, Role.EMPLEADO])
  @Get()
  findAll(@ActiveUser() user: UserActiveInterface) {
    return this.empresaService.findAll(user);
  }

  @Auth([Role.EMPRESA, Role.EMPLEADO])
  @Get('empresa')
  findAllEmpresa(@ActiveUser() user: UserActiveInterface) {
    return this.empresaService.findAllEmpresa(user);
  }


  @Auth(Role.EMPRESA)
  @Get(':id')
  findOne(@Param('id') id: number,) {
    return this.empresaService.findOne(+id);
  }

  @Auth([Role.EMPRESA, Role.SOPORTE])
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('foto', {  // ⚠️ Este nombre debe coincidir con el campo en el FormData
      storage: diskStorage({
        destination: './uploads/logo/',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `perfil_${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: number,
    @Body() updateEmpresaDto: UpdateEmpresaDto, // ⚠️ Asegúrate que no incluya el campo 'foto'
    @ActiveUser() user: UserActiveInterface,
    @UploadedFile() foto?: Express.Multer.File, // ⚠️ Nombre debe coincidir con FileInterceptor
  ) {
    return this.empresaService.update(+id, updateEmpresaDto, user, foto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.empresaService.remove(+id);
  }


  @Auth(Role.EMPRESA)
  @Get(':id/historial-pagos')
  async getHistorialPagos(
      @Param('id') idEmpresa: number,
      @Req() request: Request,
      @ActiveUser() user: UserActiveInterface
  ) {
     
      return this.empresaService.getHistorialPagos(idEmpresa, user);
  }

  @Auth(Role.SOPORTE)
  @Get(':id/historial-pagos-empresa')
  async getHistorialPagosSoporte(
      @Param('id') idEmpresa: number,
      @ActiveUser() user: UserActiveInterface
  ) {
     
      return this.empresaService.getHistorialPagosSoporte(idEmpresa, user);
  }


  @Auth([Role.EMPRESA, Role.EMPLEADO])
  @Post('findAll-renovar')
  async findAllConRenovacion(
  @ActiveUser() user: UserActiveInterface,
  @Body() renovacionDto: RenovacionPagoDto
) {
  return this.empresaService.findAll(user, renovacionDto);
}
}