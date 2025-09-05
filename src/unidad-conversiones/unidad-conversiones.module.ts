import { Module } from '@nestjs/common';
import { UnidadConversionesService } from './unidad-conversiones.service';
import { UnidadConversionesController } from './unidad-conversiones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnidadConversione } from './entities/unidad-conversione.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnidadConversione])],
  controllers: [UnidadConversionesController],
  providers: [UnidadConversionesService],
  exports: [UnidadConversionesService],
})
export class UnidadConversionesModule {}
