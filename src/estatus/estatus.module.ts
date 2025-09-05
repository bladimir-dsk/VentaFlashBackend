import { Module } from '@nestjs/common';
import { EstatusService } from './estatus.service';
import { EstatusController } from './estatus.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estatus } from './entities/estatus.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Estatus, Empresa, User])],
  controllers: [EstatusController],
  providers: [EstatusService],
  exports: [EstatusService],
})
export class EstatusModule {}
