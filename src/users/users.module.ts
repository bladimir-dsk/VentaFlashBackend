import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmpresaService } from 'src/empresa/empresa.service';
import { Pago } from 'src/pagos/entities/pago.entity';
import { PagosService } from 'src/pagos/pagos.service';
import { PlanVigencia } from 'src/plan-vigencia/entities/plan-vigencia.entity';



@Module({
  imports: [
    TypeOrmModule.forFeature([User, Empresa, Pago, PlanVigencia])//hace que me genere la tabla que le estamos proporcionando en la entity, se genera en la db.
  ],
  controllers: [UsersController],
  providers: [UsersService, EmpresaService, PagosService],
  //exportamos el modulo de usersservice para que otro modulo lo pueda usar
  exports: [UsersService]
})
export class UsersModule {}
