import { forwardRef, Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './entities/pago.entity';
import { PlanVigencia } from 'src/plan-vigencia/entities/plan-vigencia.entity';
import { Plane } from 'src/planes/entities/plane.entity';
import { Modulo } from 'src/modulos/entities/modulo.entity';
import { PlanVigenciaService } from 'src/plan-vigencia/plan-vigencia.service';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmpresaService } from 'src/empresa/empresa.service';
import { User } from 'src/users/entities/user.entity';
import { EmpresaModule } from 'src/empresa/empresa.module';
import { PlanVigenciaModule } from 'src/plan-vigencia/plan-vigencia.module';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, PlanVigencia, Plane, Modulo, Empresa, User,]),
    forwardRef(() => EmpresaModule), // ✅ Asegura que esté aquí
    PlanVigenciaModule,
    
  ],
  controllers: [PagosController],
  providers: [PagosService, PlanVigenciaService, EmpresaService, UsersService],
  exports: [PagosService],
})
export class PagosModule {}
