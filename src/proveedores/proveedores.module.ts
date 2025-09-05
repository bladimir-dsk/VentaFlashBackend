import { Module } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { ProveedoresController } from './proveedores.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proveedore } from './entities/proveedore.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmpresaService } from 'src/empresa/empresa.service';
import { PlanVigencia } from 'src/plan-vigencia/entities/plan-vigencia.entity';
import { Plane } from 'src/planes/entities/plane.entity';
import { User } from 'src/users/entities/user.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { PagosService } from 'src/pagos/pagos.service';


@Module({
  imports: [TypeOrmModule.forFeature([Proveedore, Empresa, Plane, PlanVigencia, User, Pago])],
  controllers: [ProveedoresController],
  providers: [ProveedoresService, EmpresaService, PagosService],
  exports: [ProveedoresService],
})
export class ProveedoresModule {}
