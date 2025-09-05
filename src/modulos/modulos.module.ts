import { Module } from '@nestjs/common';
import { ModulosService } from './modulos.service';
import { ModulosController } from './modulos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modulo } from './entities/modulo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Modulo])],
  controllers: [ModulosController],
  providers: [ModulosService],
  exports: [ModulosService]
})
export class ModulosModule {}
