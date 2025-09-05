import { Module } from '@nestjs/common';
import { PlanesService } from './planes.service';
import { PlanesController } from './planes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plane } from './entities/plane.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmpresaService } from 'src/empresa/empresa.service';
import { Modulo } from 'src/modulos/entities/modulo.entity';
import { ModulosService } from 'src/modulos/modulos.service';
import { PlanVigencia } from 'src/plan-vigencia/entities/plan-vigencia.entity';
import { PlanVigenciaService } from 'src/plan-vigencia/plan-vigencia.service';
import { User } from 'src/users/entities/user.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { PagosService } from 'src/pagos/pagos.service';


@Module({
  imports: [TypeOrmModule.forFeature([Plane, Empresa, Modulo, PlanVigencia, User, Pago])],
  controllers: [PlanesController],
  providers: [PlanesService, EmpresaService, ModulosService, PlanVigenciaService, PagosService],
  exports: [PlanesService],
})
export class PlanesModule {}
