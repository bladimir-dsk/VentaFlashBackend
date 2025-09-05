import { forwardRef, Module } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { PlanVigencia } from 'src/plan-vigencia/entities/plan-vigencia.entity';
import { Plane } from 'src/planes/entities/plane.entity';
import { Modulo } from 'src/modulos/entities/modulo.entity';
import { PlanVigenciaService } from 'src/plan-vigencia/plan-vigencia.service';
import { Empleado } from 'src/empleado/entities/empleado.entity';
import { User } from 'src/users/entities/user.entity';
import { PlanVigenciaModule } from 'src/plan-vigencia/plan-vigencia.module';
import { Estatus } from 'src/estatus/entities/estatus.entity';
import { Perfil } from 'src/perfil/entities/perfil.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { PagosService } from 'src/pagos/pagos.service';
import { PagosModule } from 'src/pagos/pagos.module';


@Module({
  imports: [TypeOrmModule.forFeature([Empresa, PlanVigencia, Plane, Modulo, Empleado, User, Estatus, Perfil, Pago]), PlanVigenciaModule, forwardRef(() => PagosModule),],
  controllers: [EmpresaController],
  providers: [EmpresaService, PlanVigenciaService, PagosService],
  exports: [EmpresaService],
})
export class EmpresaModule {}
