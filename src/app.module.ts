import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './empresa/empresa.module';
import { EmpleadoModule } from './empleado/empleado.module';
import { ModulosModule } from './modulos/modulos.module';
import { PerfilModule } from './perfil/perfil.module';
import { EstatusModule } from './estatus/estatus.module';
import { UnidadMedidaModule } from './unidad-medida/unidad-medida.module';
import { UnidadConversionesModule } from './unidad-conversiones/unidad-conversiones.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { PlanesModule } from './planes/planes.module';
import { PlanVigenciaModule } from './plan-vigencia/plan-vigencia.module';
import { PagosModule } from './pagos/pagos.module';
import * as dotenv from 'dotenv';
import { ConfigModule } from '@nestjs/config';
import { CajasModule } from './cajas/cajas.module';
import { CategoriaModule } from './categoria/categoria.module';


dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
      ssl: process.env.DB_SSL === "true",
      extra: {
        options: '-c timezone=America/Mexico_City',
        ssl:
          process.env.DB_SSL === "true"
            ? {
                rejectUnauthorized: false,
              }
            : null,
      },
    }),
    UsersModule,
    AuthModule,
    EmpresaModule,
    EmpleadoModule,
    ModulosModule,
    PerfilModule,
    EstatusModule,
    UnidadMedidaModule,
    UnidadConversionesModule,
    ProveedoresModule,
    PlanesModule,
    PlanVigenciaModule,

    
    forwardRef(() => PagosModule),

    
    CajasModule,

    
    CategoriaModule,
   
   
    ],
  controllers: [],
  providers: [],
})
export class AppModule {}
