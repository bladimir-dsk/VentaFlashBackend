import { Module } from '@nestjs/common';
import { PlanVigenciaService } from './plan-vigencia.service';
import { PlanVigenciaController } from './plan-vigencia.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanVigencia } from './entities/plan-vigencia.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmpresaService } from 'src/empresa/empresa.service';
import { Modulo } from 'src/modulos/entities/modulo.entity';
import { Plane } from 'src/planes/entities/plane.entity';
import { PlanesService } from 'src/planes/planes.service';
import { Empleado } from 'src/empleado/entities/empleado.entity';
import { Estatus } from 'src/estatus/entities/estatus.entity';
import { Perfil } from 'src/perfil/entities/perfil.entity';
import { User } from 'src/users/entities/user.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { PagosService } from 'src/pagos/pagos.service';


@Module({
  imports: [TypeOrmModule.forFeature([PlanVigencia, Empresa, Modulo, Plane, Empleado, Estatus, Perfil, User, Pago])],
  controllers: [PlanVigenciaController],
  providers: [PlanVigenciaService, EmpresaService, PlanesService, PagosService],
  exports: [PlanVigenciaService]
})
export class PlanVigenciaModule {}
