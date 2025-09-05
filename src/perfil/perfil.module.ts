import { Module } from '@nestjs/common';
import { PerfilService } from './perfil.service';
import { PerfilController } from './perfil.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Perfil } from './entities/perfil.entity';
import { Modulo } from 'src/modulos/entities/modulo.entity';
import { ModulosService } from 'src/modulos/modulos.service';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmpresaService } from 'src/empresa/empresa.service';
import { PlanVigencia } from 'src/plan-vigencia/entities/plan-vigencia.entity';
import { Plane } from 'src/planes/entities/plane.entity';
import { User } from 'src/users/entities/user.entity';
import { Pago } from 'src/pagos/entities/pago.entity';
import { PagosService } from 'src/pagos/pagos.service';


@Module({
  imports: [TypeOrmModule.forFeature([Perfil,Modulo, Empresa, PlanVigencia, Plane, User, Pago,])],
  exports: [PerfilService],
  controllers: [PerfilController],
  providers: [PerfilService, ModulosService, EmpresaService, PagosService,],
})
export class PerfilModule {}
