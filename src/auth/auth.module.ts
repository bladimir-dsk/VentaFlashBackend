import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt.constant';
import { EmpresaModule } from 'src/empresa/empresa.module';
import { PlanVigenciaModule } from 'src/plan-vigencia/plan-vigencia.module';
import { PagosModule } from 'src/pagos/pagos.module';


@Module({
  imports: [
    UsersModule,
    EmpresaModule,
    PagosModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: "1d" },//el token expira despues de un dia
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
